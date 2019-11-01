'use strict';
var bodyParser = require('body-parser');
var pg = require('pg');
var winston = require('winston');
var url = require('url');

var requestType = require('../model/requestType.js');
var capabilities = require('../model/capabilities.js');
var nodeExcel = require('excel-export');

const VKApi = require('node-vkapi');
let VK = new VKApi({
    app: {
        id: 5962277,
        secret: 'UH37MSTUdwrmgOL8MkO6',
        access_token: '9371f1de9371f1de9371f1de7893230170993719371f1deca6b0c23541a058573bbf986'
    }
});

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

(function (exports, require, module) {
    var app = {};
    var ResultTypes = {};
    let dataBaseService;
    class ResultController {
        constructor(expressServer, dataBaseService) {
            this.app = expressServer;
            this.dataBaseService = dataBaseService;
        }

        initializeServer(resultTypes) {
            ResultTypes = resultTypes;

            this.app.get('/result-lists', (req, res) => {
                logger.info(`/result-list: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                this.dataBaseService.getResultList(req.session.user_id, (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify(data));
                    return res.end();
                });
            })

            this.app.get('/result', (req, res) => {
                logger.info('/result');
                if (!req.session.userId) {
                    return res.redirect('/');
                }
                var id = req.query.id;

                this.dataBaseService.getResult(id, req.session.user_id, req.session.capabilities, (data) => {
                    res.setHeader('Content-Type', 'application/json');

                    res.write(JSON.stringify(data));
                    return res.end();
                });
            });

            this.app.post('/result-delete', (req, res) => {
                logger.info(`post - result-delete: ${req.body.data.resultId}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                if (!hasCapability(req, capabilities.Admin)) {
                    return res.status(403).end();
                }

                this.dataBaseService.deleteResult(req.body.data.resultId, req.session.user_id);
                return res.status(200).end();
            });

            this.app.post('/mark-result-broken', (req, res) => {
                logger.info(`post - mark-result-broken: ${req.body.data.type}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                if (!hasCapability(req, capabilities.Admin)) {
                    return res.status(403).end();
                }

                this.dataBaseService.getCurrentResult(req.session.user_id, ResultTypes[req.body.data.type], id => {
                    logger.info(`post - mark-result-broken: id : ${id}`);
                    this.dataBaseService.markBrokenResult(id);
                });

                return res.status(200).end();
            });

            this.app.get('/segment-ids', (req, res) => {
                logger.info(`get - segment: ${req.query}`);
                // console.log(`get - segment: ${req.query}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                logger.info('/segment/:name' + req.query.name);
                logger.info('/segment/:id' + req.query.id);
                logger.info('/segment/:resultName' + req.query.resultName);

                this.getSegments(req.query.name.split('_'), req.query.id, req.query.resultName, req.session.user_id, data => {
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify(data));
                    res.status(200).end();
                });
            });

            this.app.get('/files', (req, res) => {
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                logger.info('/files/:name' + req.query.resultName);
                logger.info('/files/:name' + req.query.name);
                logger.info('/files/:id' + req.query.id);

                this.dataBaseService.getSegment(req.query.id, req.query.name.split('_'), '', data => {

                    var fileName = encodeURI(`${req.query.resultName}_${req.query.name}.txt`);
                    logger.info(`fileName: ${fileName}`);
                    //   res.set({ "Content-Disposition": `attachment; filename="${fileName}"`, 'Content-type': 'text/plain' });
                    res.set({ "Content-Disposition": `attachment; filename="${fileName}"`, 'Content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    logger.info('/files/');

                    let userIds = [];
                    data.forEach(row => userIds = userIds.concat(row.UserIds));
                    logger.info(userIds.length);
                    let count = userIds.length;
                    this.dataBaseService.getUserLicense(req.session.user_id, (license) => {
                        console.log(`update-export-limit: ${JSON.stringify(license)}, exportLimit: ${license.ExportLimit}`);
                        if (license.ExportLimit != null) {
                            this.dataBaseService.updateGroupExportLimit(license.User_Id, -Math.abs(count), 0);
                        }
                    });

                    res.send(userIds.join('\r\n'));
                    res.end();
                });
            });

            this.app.post('/result-name', (req, res) => {
                logger.info('post: result-name');
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                logger.info(`post: result-name (userId: ${req.session.userId}, resultId: ${req.body.data.resultId}, newName: ${req.body.data.name})`);
                this.dataBaseService.updateResultName(req.body.data.resultId, req.body.data.name, req.session.user_id);

                res.end();
            });

            this.app.post('/export-segment', bodyParser.json({ limit: '50mb', extended: true }), (req, res) => {
                // console.log(req.body.data);
                let segmentName = req.body.data.segmentName,
                    resultId = req.body.data.resultId,
                    account_id = 0,
                    name = req.body.data.resultName,
                    userIds = [];

                this.getSegments(segmentName, resultId, name, req.session.user_id, data => {
                    account_id = data.AccountId;
                    userIds = data.UserIds;
                    name = data.Name;

                    VK.call('ads.createTargetGroup', {
                        account_id,
                        name: data.Name,
                        access_token: '9371f1de9371f1de9371f1de7893230170993719371f1deca6b0c23541a058573bbf986'
                    }).then(res => importContacts(res.response.id, 0));
                });

                const step = 1000;
                function importContacts(target_group_id, count) {
                    // console.log(`count: ${count}, account_id: ${account_id}, name: ${name}`);
                    setTimeout(() =>
                        VK.call('ads.importTargetContacts', {
                            target_group_id,
                            account_id,
                            name: data.Name,
                            contacts: userIds.slice(count, (count + 1) * step).join(','),
                            access_token: '9371f1de9371f1de9371f1de7893230170993719371f1deca6b0c23541a058573bbf986'
                        }).then(() => importContacts(count + 1)),
                        2000);
                }
            });

            this.app.get('/excel', (request, response) => {
                logger.info(`get - export excel (query: ${JSON.stringify(request.query)})`);
                // console.log(`get - export excel (query: ${JSON.stringify(request.query)})`);
                var id = request.query.resultId;

                this.dataBaseService.getExportFile(id, result => {
                    // console.log(result);
                    var file = nodeExcel.execute(result.Content);
                    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    response.setHeader("Content-Disposition", `attachment; filename=${encodeURI(result.Name)}.xlsx`);
                    response.setHeader("Cache-Control", `no-cache`);
                    response.end(file, 'binary');
                });
            })

            this.app.post('/excel', bodyParser.json({ limit: '50mb', extended: true }), (req, res) => {
                logger.info(`post - export excel (body: ${JSON.stringify(req.body.data)})`);
                // console.log(`export excel (body: ${JSON.stringify(req.body.data)})`);
                var conf = {};
                //     conf.stylesXmlFile = "styles.xml";
                conf.name = "mysheet";
                    /*conf.cols = [{
                    caption: 'string',
                    type: 'string',
                    beforeCellWrite: function (row, cellData) {
                        return cellData.toUpperCase();
                    },
                    width: 28.7109375
                }, {
                    caption: 'date',
                    type: 'date',
                    beforeCellWrite: function () {
                        var originDate = new Date(Date.UTC(1899, 11, 30));
                        return function (row, cellData, eOpt) {
                            if (eOpt.rowNum % 2) {
                                eOpt.styleIndex = 1;
                            }
                            else {
                                eOpt.styleIndex = 2;
                            }
                            if (cellData === null) {
                                eOpt.cellType = 'string';
                                return 'N/A';
                            } else
                                return (cellData - originDate) / (24 * 60 * 60 * 1000);
                        }
                    }()
                }, {
                    caption: 'bool',
                    type: 'bool'
                }, {
                    caption: 'number',
                    type: 'number'
                }];*/


                let sheetNames = Object.getOwnPropertyNames(req.body.data).filter(elem => {
                    return req.body.data.ignore.indexOf(elem) < 0;
                }),
                    sheets = [];
                console.log(`sheetNames: ${sheetNames}`);
                sheetNames.forEach(name => {
                    sheets.push(this.getSheet(req.body.data[name], name));
                });

                this.dataBaseService.saveExportFile(req.body.data.resultId, sheets, res.status(200).end);
            });
        }

        getSheet(data, name) {
            var conf = {
                name
            };
            conf.cols = [{
                caption: 'type',
                type: 'string'
            }, {
                caption: 'value',
                type: 'number'
            }, {
                caption: 'delta',
                type: 'number'
            }];
            conf.rows = [];


            data.forEach((elem) => {
                conf.rows.push([elem.label, elem.data, elem.medianValue || 0]);
            });

            return conf;
        }

        getSegments(segmentName, resultId, resultName, user_id, callback) {
            // console.log(`getSegments(segmentName: ${segmentName}, resultId: ${resultId}, resultName: ${resultName}, user_id: ${user_id}`);
            this.dataBaseService.getSegment(resultId, segmentName, '', data => {
                logger.info(`segment name: ${data[0].Name}`);
                let userIds = [];
                data.forEach(d => userIds = userIds.concat(d.UserIds));

                this.dataBaseService.getUser(user_id, (user) => {
                    callback({
                        UserIds: userIds,
                        Name: resultName,
                        AccountId: user.AccountId
                    });
                });
            });

        }
    }

    function hasCapability(req, capability) {
        return !!(req.session.capabilities & capabilities.Admin) || !!(req.session.capabilities & capability);
    }

    function containsCapability(capabilities, capability) {
        return !!(capabilities & capabilities.Admin) || !!(capabilities & capability);
    }

    module.exports = ResultController;
})(exports, require, module);