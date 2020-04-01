'use strict';
var bodyParser = require('body-parser');
var pg = require('pg');
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

(function (exports, require, module) {
    var app = {};
    let dataBaseService;
    class BlogController {
        constructor(expressServer, dataBaseService) {
            this.app = expressServer;
            this.dataBaseService = dataBaseService;
            this.initializeServer();
        }

        initializeServer() {
            this.app.get('/blog-list', (req, res) => {
                logger.info(`/blog-list: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                this.dataBaseService.getBlogs((data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify({ data }));
                    res.status(200).end();
                });
            });

            this.app.get('/blog', (req, res) => {
                logger.info(`/get-blog: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                var id = req.query.id;

                this.dataBaseService.getBlog(id, (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify({ data }));
                    res.status(200).end();
                });
            });

            this.app.post('/blog', bodyParser.json(), (req, res) => {
                logger.info(`/update-blog: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                if (!hasCapability(req, capabilities.EditBlog)) {
                    return res.status(403).end();
                }

                var blog = req.body.blog;
                this.dataBaseService.updateBlog(blog, req.session.user_id);

                res.status(200).end();
            });

            this.app.delete('/blog', (req, res) => {
                logger.info(`/delete-blog: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                if (!hasCapability(req, capabilities.EditBlog)) {
                    return res.status(403).end();
                }

                this.dataBaseService.deleteBlog(req.query.id, req.session.user_id);
            });
        }
    }

    function hasCapability(req, capability) {
        return !!(req.session.capabilities & capabilities.Admin) || !!(req.session.capabilities & capability);
    }

    function containsCapability(capabilities, capability) {
        return !!(capabilities & capabilities.Admin) || !!(capabilities & capability);
    }
        
    module.exports = BlogController;
})(exports, require, module);