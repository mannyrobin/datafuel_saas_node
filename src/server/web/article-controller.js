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
    class ArticleController {
        constructor(expressServer, dataBaseService) {
            this.app = expressServer;
            this.dataBaseService = dataBaseService;
            this.initializeServer();
        }

        initializeServer() {
            this.app.get('/article-list', (req, res) => {
                logger.info(`/article-list: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                this.dataBaseService.getArticles((data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify({ data }));
                    res.status(200).end();
                });
            });

            this.app.get('/article', (req, res) => {
                logger.info(`/get-article: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                var id = req.query.id;

                this.dataBaseService.getArticle(id, (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify({ data }));
                    res.status(200).end();
                });
            });

            this.app.post('/article', bodyParser.json(), (req, res) => {
                logger.info(`/update-article: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                if (!hasCapability(req, capabilities.EditArticle)) {
                    return res.status(403).end();
                }

                var article = req.body.article;
                this.dataBaseService.updateArticle(article, req.session.user_id);

                res.status(200).end();
            });

            this.app.delete('/article', (req, res) => {
                logger.info(`/delete-article: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                if (!hasCapability(req, capabilities.EditArticle)) {
                    return res.status(403).end();
                }

                this.dataBaseService.deleteArticle(req.query.id, req.session.user_id);
            });
        }
    }

    function hasCapability(req, capability) {
        return !!(req.session.capabilities & capabilities.Admin) || !!(req.session.capabilities & capability);
    }

    function containsCapability(capabilities, capability) {
        return !!(capabilities & capabilities.Admin) || !!(capabilities & capability);
    }
        
    module.exports = ArticleController;
})(exports, require, module);