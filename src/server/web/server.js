'use strict'

var fs = require('fs');
var https = require('https');
var express = require('express');
var session = require('express-session');
var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');
var url = require('url');
var uuid = require('uuid');
var crypto = require('crypto');
var fileUpload = require('express-fileupload');
var Promise = require("es6-promise").Promise;

var capabilities = require('../model/capabilities.js');
var Rates = require('../model/rates.js');

var restAPI = require('../service/rest-service.js');

var AnalisysController = require('./analisys-controller');
var BlogController = require('./blog-controller');
var ArticleController = require('./article-controller');
var UserController = require('./user-controller');
var ResultController = require('./result-controller');
var PaymentService = require('../service/payment-service.js');

var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: './logs/server-data-fuel.log',
            maxsize: 1024 * 1024 * 10,
            maxFiles: 10,
            json: false,
            eol: '\r\n'
        })
    ]
});

const VKApi = require('node-vkapi');
let VK = new VKApi({
    app: {
        id: 5962277,
        secret: 'UH37MSTUdwrmgOL8MkO6',
        access_token: '9371f1de9371f1de9371f1de7893230170993719371f1deca6b0c23541a058573bbf986'
    }
});

var DIR = './uploads/';

const app = express();
var expressWs = require('express-ws')(app);

var options = {
    key: fs.readFileSync('./ssl/domain.key'),
    cert: fs.readFileSync('./ssl/domain.crt'),
};

var server = https.createServer(options, app).listen(433, function () {
    console.log("Express server listening on port " + 433);
});

app.use(bodyParser.json({ extended: true, limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser('SECRET'));

app.use(express.static(__dirname + '/dist'));
app.use(express.static(__dirname + '/resources'));
app.use(express.static(__dirname + '/vendor'));
app.use(express.static(__dirname + '/vendor/flot'));

// console.log(__dirname + '/dist');

process.on('uncaughtException', (err) => {
    console.log(err);
    logger.error(err);
});

process.on('unhandledRejection', (reason, p) => {
    console.log(reason);
    console.log(p);
    logger.error(reason);
    logger.error(p);
    // unhandledRejections.set(p, reason);
});
process.on('rejectionHandled', (p) => {
    console.log(p);
    logger.error(p);
    //  unhandledRejections.delete(p);
});

(function (exports, require, module) {
    let ResultTypes = {};
    let ACCESS_TOKEN = null;
    let analisysController = {};
    let blogController = {};

    module.exports = {
        initialize: function server(assetUrl, dataBaseService, baseUrl) {
            var sessionId = crypto.createHash('sha256').update(uuid.v1()).update(crypto.randomBytes(256)).digest('hex');
            app.use(fileUpload());
            app.use(session({
                key: 'app.sess',
                httpOnly: true,
                secret: 'SECRET',
                resave: true,
                saveUninitialized: true,
                rolling: true,
                cookie: {
                    secure: false,
                    maxAge: 6000000
                },
                genid: function (req) {
                    return crypto.createHash('sha256').update(uuid.v1()).update(crypto.randomBytes(256)).digest('hex');
                },
            }));

            new restAPI(app, dataBaseService);
            analisysController = new AnalisysController(app, dataBaseService, baseUrl, expressWs);
            blogController = new BlogController(app, dataBaseService);
            new ArticleController(app, dataBaseService);
            new UserController(app, dataBaseService);
            new PaymentService(app, dataBaseService);
            const resultController = new ResultController(app, dataBaseService);

            dataBaseService.getResultTypes((data) => {
                for (let i = 0; i < data.length; i++) {
                    ResultTypes[data[i].Name.toLowerCase()] = data[i].Id;
                };

                analisysController.initializeServer(ResultTypes);
                resultController.initializeServer(ResultTypes);
            });

            app.get('/login', function (req, res) {
                logger.info('/login');
                logger.info(`req.session.userId = ${req.session.userId}`);
                if (!req.session.userId) {
                    return res.sendFile(__dirname + '/dist/index.html');
                    //    return res.end(renderHTML(req.connection.ssl ? 'https' : 'http'));
                } else {
                    res.redirect('/analisys');
                }
            });
            app.get('/analisys/*', getSite);
            app.get('/', (req, res) => res.redirect('/login'));

            app.post('/feedback', bodyParser.json(), (req, res) => {
                logger.info('post-feedback');
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                dataBaseService.addFeedback(req.session.user_id, req.body.data.text);

                res.status(200).end();

            });

            app.get('/is-logged-in', (req, res) => {
                logger.info(`is-logged-in: ${req.session.userId}`);
                res.setHeader('Content-Type', 'application/json');
                res.write(JSON.stringify({
                    auth: !!req.session.userId,
                    capability: req.session.capabilities
                }));
                res.status(200).end();
            })

            function hasCapability(req, capability) {
                return !!(req.session.capabilities & capabilities.Admin) || !!(req.session.capabilities & capability);
            }

            function containsCapability(capabilities, capability) {
                return !!(capabilities & capabilities.Admin) || !!(capabilities & capability);
            }

            function getGroupsInfo(groupIds, callback) {
                VK.call('groups.getById', { 'group_ids': groupIds, access_token: '9371f1de9371f1de9371f1de7893230170993719371f1deca6b0c23541a058573bbf986' },
                    (data) => {
                        var groupsInfo = [];
                        logger.info('data');
                        logger.info(data);
                        data.response.forEach((responce) => {
                            groupsInfo.push({
                                id: responce.id,
                                name: responce.name,
                                url: `https://vk.com/${responce.screen_name}`
                            });
                        });

                        logger.info('groupsInfo');
                        logger.info(groupsInfo);
                        callback(groupsInfo);
                    }, error => logger.error(`error: ${error}`));
            }

            app.get('/analisys', getSite);

            app.get('/results*', getSite);

            app.get('/look-a-like', getSite);
            app.get('/searchByPhone', getSite);
            app.get('/admin', getSite);
            app.get('/user-profile', getSite);
            app.get('/busy*', getSite);

            function getSite(req, res, next) {
                var url_parts = url.parse(req.url, true);
                if (!req.session.userId) {
                    return res.redirect('/login');
                }

                return res.sendFile(__dirname + '/dist/index.html');
                //return res.end(renderHTML(req.connection.ssl ? 'https' : 'http'));
            };

            app.post('/login', bodyParser.json(), function (req, res, next) {
                logger.info('post - login');

                logger.info(`req.body.expire = ${req.body.context.expire - Math.round(new Date().getTime() / 1000.0)}`);
                req.session.userId = req.body.context.user.id;
                req.session.cookie.maxAge = 600000 * 60 * 24;
                req.session.vkSession = req.body.context.session;

                dataBaseService.addUser(req.body.context.user.id, req.body.context.user.first_name, req.body.context.user.href, (data, permissions) => {
                    var jsonData = JSON.stringify(data);
                    logger.info(`User logged: ${jsonData}`);
                    logger.info(data);
                    req.session.user_id = data.User_Id || data;
                    req.session.capabilities = permissions || data.Capabilities;
                    req.session.remainRequests = data.Requests;

                    // saves the IP address of the user.
                    let userIP = req.connection.remoteAddress;
                    dataBaseService.getUser(req.session.user_id, user => {
                        if (user.IP != null) {
                            return;
                        }

                        user.IP = userIP;
                        dataBaseService.updateUser(user);
                    })

                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify({
                        capability: req.session.capabilities
                    }));
                    return res.status(200).end();
                });
            });

            app.delete('*/login', function (req, res, next) {
                req.session.userId = null;
                return res.end();
            });

            app.get('/vk-auth', function (req, res) {
                var url_parts = url.parse(request.url, true);

                req.session.userId = url_parts.query.access_token;
                req.session.cookie.maxAge = url_parts.query.expires_in;
                return res.end('/site');
            })

            app.get('*/polyfills.js', function (req, res) {
                logger.info('polyfills.js');
                res.sendFile(__dirname + '/dist/polyfills.js');
            })

            app.get('*/vendor.js', function (req, res) {
                logger.info('vendor.js');
                res.sendFile(__dirname + '/dist/vendor.js');
            })

            app.get('/notificationIcon', function (req, res) {
                logger.info('notificationIcon');
                res.sendFile(__dirname + '/resources/icon.png');
            })

            app.get('*/app.js', function (req, res) {
                logger.info('app.js');
                res.sendFile(__dirname + '/dist/app.js');
            });
            /*
                        app.get('pixeladmin.min.css', function (req, res) {
                            logger.info('pixeladmin.min.css');
                            res.sendFile(__dirname + '/dist/pixeladmin.min.css');
            });*/

            logger.info(process.env.NODE_PATH);
            //const assetUrl = /*process.env.NODE_PATH ? 'http://localhost:8080' : */'http://138.68.168.123:3001'; //'http://138.68.168.123:3001';//
            const PORT = process.env.PORT || 3002;

            // console.log(`assetUrl: ${assetUrl}`);
            logger.info(assetUrl);
            //<script type="application/javascript" src="${assetUrl}/public/assets/bundle.js"></script>
            function renderHTML(schema) {
                // console.log(`assetUrl: ${assetUrl}`);
                let currentUrl = (assetUrl.indexOf(':') < 0 ? 'https://' : 'http://') + assetUrl;// + (((schema == 'http') && assetUrl.indexOf(':') < 0) ? `:${PORT}` : '');
                // console.log(`currentUrl: ${currentUrl}`);
                return `<!DOCTYPE html>
                    <html>
                    <head>
                    <base href="/">
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Data Fuel</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <script src="https://vk.com/js/api/openapi.js?136" type="text/javascript"></script>
                        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet">
                        <link href="http://localhost:3002/pixeladmin.min.css" rel="stylesheet">
                        <script type="application/javascript" src="http://localhost:3002/jquery.js"></script>
                        <script type="application/javascript" src="http://localhost:3002/jquery.flot.js"></script>
                        <script type="application/javascript" src="http://localhost:3002/jquery.flot.pie.js"></script>
                        <script type="application/javascript" src="http://localhost:3002/jquery.flot.resize.js"></script>
                        <script type="application/javascript" src="http://localhost:3002/jquery.flot.categories.js"></script>
                    </head>
                    <body style="background-color: #f6f6f6!important;">
                    <my-app>Loading...</my-app>

                    <script type="application/javascript" src="${currentUrl}/polyfills.js"></script>
                    <script type="application/javascript" src="${currentUrl}/vendor.js"></script>
                    <script type="application/javascript" src="${currentUrl}/app.js"></script>
                    </script>
                    </body>
                    </html>`;
            }


            app.listen(PORT, function () {
                 console.log('Server listening on:' + PORT);
            });

            function guid() {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            }
        }
    }
})(module.exports, null, module);