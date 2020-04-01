'use strict';
var bodyParser = require('body-parser');
var pg = require('pg');
var winston = require('winston');
var capabilities = require('../model/capabilities.js');

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
    class UserController {
        constructor(expressServer, dataBaseService) {
            this.app = expressServer;
            this.dataBaseService = dataBaseService;
            this.initializeServer();
        }

        initializeServer() {

            this.app.get('/rates', (req, res) => {
                res.setHeader('Content-Type', 'application/json');
                var billableOnly = req.query.billableOnly;

                this.dataBaseService.getAvailableRates(billableOnly, rates => {
                    res.write(JSON.stringify(rates));
                    return res.end();
                });
            });

            this.app.get('/user-email', (req, res) => {
                logger.info('app.get(/user-email)');
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                res.setHeader('Content-Type', 'application/json');

                this.dataBaseService.getUserEmail(req.session.user_id, (email) => {
                    logger.info(`app.get(user-email: ${email})`);

                    res.write(JSON.stringify({ email }));
                    res.status(200).end();
                });
            });

            this.app.get('/user-rate-id', (req, res) => {
                logger.info('get - user-rate-id');
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                var userId = req.query.userId;

                if (userId > 0) {
                    this.dataBaseService.getUsersByFilter({ userId }, users => {
                        var id = users[0].Id;

                        this.dataBaseService.getUserLicense(id, (rate) => {
                            res.setHeader('Content-Type', 'application/json');
                            if (rate) {
                                rate.Id = rate.Rate_Id;
                            }

                            res.write(JSON.stringify(rate));
                            res.status(200).end();
                        });
                    });
                } else {
                    this.dataBaseService.getUserLicense(req.session.user_id, (rate) => {
                        res.setHeader('Content-Type', 'application/json');
                        if (rate) {
                            rate.Id = rate.Rate_Id;
                        }

                        res.write(JSON.stringify(rate));
                        res.status(200).end();
                    });
                }
            });

            this.app.get('/user-info', (req, res) => {
                logger.info('get - user-info');
                if (!req.session.userId) {
                    return res.status(401).end();
                }
                res.setHeader('Content-Type', 'application/json');

                this.dataBaseService.getUser(req.session.user_id, (user) => {
                    logger.info('get - user-info');
                    logger.info(user);

                    this.dataBaseService.getUserLicense(user.Id, (license) => {
                        logger.info(license);
                        license = license || {};
                        res.write(JSON.stringify({
                            Name: user.Name,
                            Money: user.Money,
                            Requests: license.Requests,
                            AccountId: user.AccountId,
                            Email: user.Email,
                            Capability: license.Capabilities,
                            Id: user.Id,
                            ExportLimit: license.ExportLimit,
                            TotalRequestLimit: license.TotalRequestLimit,
                            Promo: user.Promo
                        }));
                        res.status(200).end();
                    });
                })
            });

            this.app.post('/update-export-limit', bodyParser.json(), (req, res) => {
                logger.info('post - update-export-limit');
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                let count = req.body.data.count;
                logger.info(`count: ${count}`);
                this.dataBaseService.getUserLicense(req.session.user_id, (license) => {
                    logger.info(`update-export-limit: ${JSON.stringify(license)}, exportLimit: ${license.ExportLimit}`);
                    if (license.ExportLimit != null) {
                        this.dataBaseService.updateGroupExportLimit(license.User_Id, -Math.abs(count), 0);
                    }
                });
                res.end();
            });

            this.app.get('/users-info', (req, res) => {
                logger.info('get - users-info');
                if (!req.session.userId || !hasCapability(req, capabilities.Admin)) {
                    return res.status(401).end();
                }

                this.dataBaseService.getUsersInfo((usersInfo) => {
                    logger.info('get - users-info');
                    logger.info(usersInfo);

                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify({ usersInfo }));
                    res.status(200).end();
                })
            });

            this.app.post('/cancel-request', bodyParser.json(), (request, response) => {
                logger.info(`cancel-request(resultId: ${request.body.data.resultId}, userId: ${request.session.user_id})`);

                this.dataBaseService.deleteResult(request.body.data.resultId, request.session.user_id);
                response.status(200).end();
            });

            this.app.post('/set-permissions', bodyParser.json(), (request, response) => {
                logger.info(`set-permissions(userId: ${request.body.data.userId}, permissions: ${request.body.data.permissions})`);

                if (!request.session.userId || !hasCapability(request, capabilities.Admin)) {
                    return response.status(401).end();
                }

                this.dataBaseService.getUsersByFilter({ userId: request.body.data.userId }, users => {
                    let user = users[0];
                    this.dataBaseService.setPermissions(user.Id, request.body.data.permissions, result => {
                        response.setHeader('Content-Type', 'application/json');
                        response.write(JSON.stringify(result));
                        response.status(200).end();
                    });
                });
            });

            this.app.post('/add-requests', bodyParser.json(), (req, res) => {
                logger.info(`/add-requests: ${req.session.id}`);
                if (!req.session.userId || !hasCapability(req, capabilities.Admin)) {
                    return res.status(401).end();
                }

                // console.log(`req.body.userId: ${JSON.stringify(req.body.data)}`);

                this.dataBaseService.addRequests({ UserId: req.body.data.userId, Count: req.body.data.requests }, callback);

                function callback(result) {
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify(result));
                    res.status(200).end();
                }
            });

            this.app.post('/user-profile', bodyParser.json(), (req, res) => {
                logger.info(`/user-profile: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                var userProfile = req.body.userProfile;

                logger.info(userProfile);
                userProfile.Id = req.session.user_id;
                this.dataBaseService.updateUserProfile(userProfile);

                res.status(200).end();
            });

            this.app.post('/add-money', bodyParser.json(), (req, res) => {
                logger.info(`/add-money: ${req.session.id}`);
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                this.dataBaseService.addMoney(req.session.user_id, req.body.sum, (balance) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify({ balance }));
                    res.status(200).end();
                });
            });

            this.app.post('/update-email', bodyParser.json(), (req, res) => {
                logger.info('update-email');
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                this.dataBaseService.updateUserEmail(req.session.user_id, req.body.data);
                res.status(200).end();

            });

            this.app.post('/update-advertisement-id', bodyParser.json(), (req, res) => {
                logger.info('update-advertisement-id');
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                this.dataBaseService.updateUserAdvertisementId(req.session.user_id, req.body.data);
                res.status(200).end();
            });

            this.app.post('/select-rate', bodyParser.json(), (req, res) => {
                logger.info(`select-rate(userId: ${req.session.userId}, rateId: ${req.body.data.rateId})`);
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                this.dataBaseService.getUser(req.session.user_id, user => {
                    this.dataBaseService.selectRate({ user, rateId: req.body.data.rateId }, data => {
                        req.session.capabilities = data.Capabilities;
                        // console.log(`capabilities: ${capabilities}`)

                        res.setHeader('Content-Type', 'application/json');
                        res.write(JSON.stringify(data));
                        res.status(200).end();
                    });
                });
            });

            this.app.post('/set-rate', bodyParser.json(), (req, res) => {
                logger.info(`select-rate(userId: ${req.session.userId})`);
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                if (!hasCapability(req, capabilities.Admin)) {
                    return res.status(403).end();
                }

                this.dataBaseService.getUsersByFilter({ userId: req.body.data.userId }, users => {
                    this.dataBaseService.selectRate({ user: users[0], rateId: req.body.data.rateId, force: true }, data => {
                        res.setHeader('Content-Type', 'application/json');
                        res.write(JSON.stringify(data));
                        res.status(200).end();
                    });
                });
            });

            this.app.post('/activate-promo-code', (req, res) => {
                logger.info(`activate-promo-code(userId: ${req.session.userId})`);
                if (!req.session.user_id) {
                    return res.status(401).end();
                }

                res.setHeader('Content-Type', 'application/json');

                let userIP = getIP(req);
                let promo = req.body.data.promo;

                var specialPromo = this.dataBaseService.getSpecialPromo(promo);
                var specialPromoRateId = specialPromo != null ? specialPromo.Rate_Id : null;
                if (specialPromoRateId != null) {

                    this.dataBaseService.getPromoRelationships({ secondaryUserId: req.session.user_id }, relatedUsers => {
                        if (relatedUsers == null || relatedUsers.length < specialPromo.Times) {
                            this.dataBaseService.createPromoRelationship({ primaryUserId: 1, secondaryUserId: req.session.user_id }, success => {

                                if (success) {
                                    this.dataBaseService.setUserLicense(req.session.user_id, specialPromoRateId, data => {
                                        logger.info(JSON.stringify(data));
                                        res.setHeader('Content-Type', 'application/json');
                                        res.write(JSON.stringify(data));
                                        res.status(200).end();
                                    });
                                }
                            });

                            return;
                        }

                        res.write(JSON.stringify({ message: `для вашего аккаунта уже был активирован промо код, свяжитесь с поддержкой, если вы еше не активировали промо код` }));
                        logger.error(`PROMO ALARM req.session.user_id: ${req.session.user_id}`);
                        return res.status(200).end();
                    });

                    return;
                }

                this.dataBaseService.getUsersByFilter({ promo }, users => {
                    if (users == null || users.length == 0) {
                        res.write(JSON.stringify({ message: `промо код ${promo} не зарегистрирован, проверьте правильность написания` }));
                        return res.status(200).end();
                    }

                    let primaryUser = users[0];
                    let secondaryUserId = req.session.user_id;

                    logger.info(`primaryUser: ${JSON.stringify(primaryUser)}`);
                    logger.info(`secondaryUserId: ${secondaryUserId}, userIP: ${userIP}`);

                    if (primaryUser.Id == secondaryUserId) {
                        res.write(JSON.stringify({ message: `промо код ${promo} зарегистрирован для вашего пользователя, свяжитесь с поддержкой, если вы еше не регистрировали этот промо код` }));
                        logger.error(`PROMO ALARM ${JSON.stringify(primaryUser)}`);
                        return res.status(200).end();
                    }

                    this.dataBaseService.getPromoRelationships({ primaryUserId: primaryUser.Id, secondaryUserId }, relatedUsers => {
                        let canBeActivated = false;
                        logger.log(`relatedUsers: ${JSON.stringify(relatedUsers)}`);
                        if (relatedUsers == null || relatedUsers.length == 0) {
                            activatePromo({ primaryUserId: primaryUser.Id, secondaryUserId }, this.dataBaseService);
                            return;
                        }

                        let similarUsers = relatedUsers.filter(u => /*u.IP == userIP || */u.Id == req.session.user_id);

                        if (similarUsers.length > 0) {
                            res.write(JSON.stringify({ message: `для вашего аккаунта уже был активирован промо код, свяжитесь с поддержкой, если вы еше не активировали промо код` }));
                            logger.error(`PROMO ALARM ${JSON.stringify(primaryUser)}`);
                            return res.status(200).end();
                        }

                        activatePromo({ primaryUserId: primaryUser.Id, secondaryUserId }, this.dataBaseService);
                    });
                });

                /**
                 * 
                 * @param {{primaryUserId: number, secondaryUserId: number}} context 
                 * @param {object} dataBaseService
                 */
                function activatePromo(context, dataBaseService) {
                    // add promo relationship
                    dataBaseService.createPromoRelationship(context, success => {
                        if (!success) {
                            res.write(JSON.stringify({ message: `произошла ошибка, свяжитесь с поддержкой` }));
                            return res.status(200).end();
                        }

                        // select the promo license
                        dataBaseService.setPromoLicense(context.secondaryUserId, (license, success) => {
                            if (!success) {
                                res.write(JSON.stringify({ message: `произошла ошибка, свяжитесь с поддержкой` }));
                                return res.status(200).end();
                                return;
                            }

                            req.session.capabilities = license.Permissions;

                            // provide gift for primary user
                            dataBaseService.addMoney(context.primaryUserId, 100, money => { });

                            res.write(JSON.stringify({ message: `промо код ${promo} был успешно активирован`, success: true, license }));
                            return res.status(200).end();

                        });
                    });
                }
            });

            this.app.post('/set-promo-code', (req, res) => {
                logger.info(`set-promo-code(userId: ${req.session.userId})`);
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                let promo = req.body.data.promo;

                this.dataBaseService.getUsersByFilter({ promo }, users => {
                    if (users != null && users.length > 0) {
                        res.setHeader('Content-Type', 'application/json');
                        res.write(JSON.stringify({ message: `промо код ${promo} уже зарегистрирован для другого пользователя`, success: false }));
                        return res.status(200).end();
                    }

                    this.dataBaseService.getUser(req.session.user_id, user => {
                        if (user.Promo != null) {
                            res.setHeader('Content-Type', 'application/json');
                            res.write(JSON.stringify({ message: 'у вас уже есть промо код, для его изменения свяжитесь с поддержкой', success: false }));
                            return res.status(200).end();
                        }

                        user.IP = getIP(req);
                        user.Promo = req.body.data.promo;

                        this.dataBaseService.updateUser(user);
                        res.setHeader('Content-Type', 'application/json');
                        res.write(JSON.stringify({ message: 'ваш промокод успешно зарегистрирован', success: true }));
                        return res.status(200).end();
                    });
                });
            });
        }
    }

    function getIP(req) {
        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    }

    function hasCapability(req, capability) {
        return !!(req.session.capabilities & capabilities.Admin) || !!(req.session.capabilities & capability);
    }

    function containsCapability(capabilities, capability) {
        return !!(capabilities & capabilities.Admin) || !!(capabilities & capability);
    }

    module.exports = UserController;
})(exports, require, module);