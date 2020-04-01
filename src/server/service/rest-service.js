'use strict';
var bodyParser = require('body-parser');
var pg = require('pg');
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: './logs/rest-service-data-fuel.log',
            maxsize: 1024 * 1024 * 10,
            maxFiles: 10,
            json: false,
            eol: '\r\n'
        })
    ]
});

(function (exports, require, module) {
    var app = {};
    const baseUrl = '/api/v1';
    class RestService {
        constructor(expressServer, dataBaseService) {
            app = expressServer;

            app.post(baseUrl + '/result', bodyParser.json(), (req, res) => {
                logger.info('Started: result');
                logger.info(res.body);

                res.status(200).end();
                dataBaseService.saveResults(res.body.id, res.body.resultJson);
                logger.info('Finished: post - result');
            });
        }
    }

    module.exports = RestService;
})(module.exports, null, module);