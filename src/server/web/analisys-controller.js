'use strict';
var bodyParser = require('body-parser');
var pg = require('pg');
var winston = require('winston');

var requestType = require('../model/requestType.js');
var capabilities = require('../model/capabilities.js');
var socialStorageService = require('../service/socialStorageService.js');
var mailService = require('../service/mail-service.js');
var nodeExcel = require('excel-export');

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

const Ages = ["0-18",
    "18-21",
    "21-24",
    "24-27",
    "27-30",
    "30-35",
    "35-45",
    "45-99"];
let MbtiTypes = [];
let webSockets = {};

(function (exports, require, module) {
    let ResultTypesEntity = {};
    class AnalisysController {
        constructor(expressServer, dataBaseService, baseUrl, wsInstance) {
            this.app = expressServer;
            this.dataBaseService = dataBaseService;
            this.baseUrl = baseUrl;
            this.wsInstance = wsInstance;
            socialStorageService.initialize(dataBaseService);
        }

        initializeServer(ResultTypes, mbtiTypes = []) {
            ResultTypesEntity = ResultTypes;
            console.log(`ResultTypes: ${JSON.stringify(ResultTypes)}`);
            this.dataBaseService.getMBTI_Types(types => {
                MbtiTypes = [];

                for (let i = 0; i < types.length; i++) {
                    MbtiTypes.push(types[i].Type);
                }

                // Re-ran existing requests.
                this.dataBaseService.getRequestWithStatus('busy', queue => {
                    //        // console.log(`re-ran length: ${queue.length}`);
                    if (queue.length > 0) {
                        this.dataBaseService.clearUserForProcessing(() => {
                            queue.forEach(this.rerunAction.bind(this));
                        });
                    }
                });

                // Re-ran existing requests.
                this.dataBaseService.getRequestWithStatus('idle', queue => {
                    //        // console.log(`re-ran length: ${queue.length}`);
                    if (queue.length > 0) {
                        queue.forEach(request => this.executeAction(request.Context, request.Result_Id, this.runAnalisys.bind(this)));
                    }
                });
            })

            this.app.get('/checkStatus', (req, res) => {
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                var type = req.query.type;

                switch (type) {
                    case requestType.analisys:
                        this.dataBaseService.getAnalisysStatus(req.session.user_id, ResultTypes[requestType.analisys], (result) => {
                            res.write(JSON.stringify({ busy: result.Name != null, progress: result.Progress % 100 }));
                            return res.status(200).end();
                        });
                        break;
                    case requestType.segment:
                        this.dataBaseService.getAnalisysStatus(req.session.user_id, ResultTypes[requestType.segment], (result) => {
                            res.write(JSON.stringify({ busy: result.Name != null, progress: result.Progress % 100 }));
                            return res.status(200).end();
                        });
                }
            });

            this.app.ws('/', (ws, req) => {
                ws.on('message', (msg, a) => {
                    logger.info(`message: ${msg}`);
                    // console.log(`message: ${msg}`);
                    let data = JSON.parse(msg);
                    // console.log(`message: ${data.type}`);

                    this[data.type](data, req.session.user_id);
                });
                ws.on('close', (msg) => {
                    logger.log(`close: ${msg}`);
                    // console.log(`close: ${msg}`);

                    webSockets[req.session.user_id] = webSockets[req.session.user_id].filter(socket => socket.readyState == 1);
                    // console.log('webSockets:' + webSockets[req.session.user_id].length);
                });

                // console.log('socket', req.session.user_id);
                // console.log(this.wsInstance.getWss().clients.length);
                var existSockies = webSockets[req.session.user_id] || [];
                existSockies.push(ws);
                webSockets[req.session.user_id] = existSockies;
                // console.log('webSockets:' + webSockets[req.session.user_id].length);


                this.SendNotification = (text, userId, resultId, type = 'browserNotification') => {

                    logger.info('SendNotification');
                    logger.info(`userId: ${userId}, resultId: ${resultId}`);


                    if (userId != req.session.user_id) {
                        return;
                    }

                    this.sendEmail(`${text}. Перейти к результату: ${this.baseUrl}/results/${resultId}`, userId, resultId);

                    try {
                        var sockets = webSockets[req.session.user_id][0];
                        sockets.send(JSON.stringify({
                            text,
                            resultId,
                            type
                        }));
                    } catch (ex) {
                        // console.log('SendNotification: error');
                        // console.log(ex);

                        logger.error('SendNotification: error');
                        logger.error(ex);
                    }
                };
            });

            this.app.post('*/upload', (req, res, next) => {
                logger.info('post - upload');
                console.log('post - upload');
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                var id = req.query.id;
                var type = req.query.type;

                switch (type) {
                    case requestType.analisys:
                        if (!hasCapability(req, capabilities.Analisys)) {
                            return res.status(403).end();
                        }
                        break;

                    case requestType.segment:
                        if (!hasCapability(req, capabilities.Segmentation)) {
                            return res.status(403).end();
                        }
                        break;

                    case requestType.sourceGroupFile:
                    case requestType.targetGroupFile:
                        if (!hasCapability(req, capabilities.LookALike)) {
                            return res.status(403).end();
                        }
                        break;
                    case requestType.usersByPhones:
                        if (!hasCapability(req, capabilities.Admin)) {
                            return res.status(403).end();
                        }
                        break;
                    default:
                        return res.status(501).end();
                }

                var file = req.files.file;

                var text = file.data.toString('ascii', 0, file.data.length).replace('\\u0000', '');
                console.log(`text: ${text.length}`);

                var context = {
                    data: text,
                    userId: req.session.user_id,
                    name: file.name,
                    requestType: ResultTypes[type],
                    notificationRequired: req.query.notificationRequired == true
                };
                logger.info('ResultTypes[type]');
                logger.info(ResultTypes[type]);

                switch (type) {
                    case requestType.usersByPhones:
                        if (!hasCapability(req, capabilities.SearchByPhone)) {
                            return res.status(403).end();
                        }

                        this.dataBaseService.createFile(text, (result) => {
                            console.log(`resykt: ${JSON.stringify(result)}`)
                            res.write(JSON.stringify(result));
                            res.status(200).end();
                        });

                        return;
                    case requestType.analisys:
                        logger.info(`req.session.capabilities: ${req.session.capabilities}`);
                        logger.info(`capabilities.Analisys: ${capabilities.Analisys}`);

                        if (!hasCapability(req, capabilities.Analisys)) {
                            return res.status(403).end();
                        }

                        this.createRequest(context);
                        break;

                    case requestType.segment:
                        logger.info(`req.session.capabilities: ${req.session.capabilities}`);
                        logger.info(`capabilities.Segmentation: ${capabilities.Segmentation}`);

                        if (!hasCapability(req, capabilities.Segmentation)) {
                            return res.status(403).end();
                        }

                        this.createRequest(context);
                        break;
                    case requestType.sourceGroupFile:
                        this.createOrUpdateRequest({ guid: req.query.guid }, { sourceGroupId: text }, res.status(200).end);
                        // saves file
                        return;
                    case requestType.targetGroupFile:
                        // saves file
                        this.createOrUpdateRequest({ guid: req.query.guid }, { targetGroupId: text }, res.status(200).end);
                        return;
                    default:
                        return;

                }
                res.status(200).end();
                console.log(`post - upload - end`);
            });

            this.app.post('/look-a-like', bodyParser.json({ limit: '50mb', extended: true }), (req, res) => {
                logger.info(`post - look-a-like: ${req.session.userId}, capabilities: ${req.session.capabilities}`);
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                if (!hasCapability(req, capabilities.LookALike)) {
                    return res.status(403).end();
                }

                var context = {
                    userId: req.session.user_id,
                    sourceGroupId: req.body.data.sourceGroupId,
                    targetGroupId: req.body.data.targetGroupId,
                    name: req.body.data.name.replace('\\u0000', ''),
                    notificationRequired: req.body.data.notificationRequired == true,
                    guid: req.body.data.guid,
                    count: req.body.data.count,
                    requestType: ResultTypes[requestType.lookALike],
                    sex: req.body.data.sex || 0,
                };

                this.createRequest(context, res.status(200).end);
            });

            this.app.post('/savedPhones', bodyParser.json({ limit: '50mb', extended: true }), (req, res) => {
                logger.info(`post - savedPhones: ${req.session.userId}, capabilities: ${req.session.capabilities}`);
                if (!hasCapability(req, capabilities.SearchByPhone)) {
                    return res.status(403).end();
                }
                var data = JSON.parse(req.body.data) || {};

                this.dataBaseService.getFile(data.fileId, query => {
                    var sheet = query.result[0].Content;
                    var file = nodeExcel.execute(sheet);
                    
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader("Content-Disposition", `attachment; filename=${encodeURI(data.name)}.xlsx`);
                    res.setHeader("Cache-Control", `no-cache`);
                    return res.end(file, 'binary');
                });
            });

            this.app.post('/phones', bodyParser.json({ limit: '50mb', extended: true }), (req, res) => {
                logger.info(`post - phones: ${req.session.userId}, capabilities: ${req.session.capabilities}`);
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                var data = JSON.parse(req.body.data) || {};
                var sheet = null;
                var phones = [];
                var hash = data.hash;
                var self = this;

                //console.log(`req.body.data: ${req.body.data}`);

                if (data.phones) {
                    //console.log(`req.body.data: ${JSON.stringify(data.phones)}`);
                    phones = data.phones;

                    if (!hasCapability(req, capabilities.SearchByPhone)) {
                        return res.status(403).end();
                    }
                } else if (data.fileId) {

                    if (!hasCapability(req, capabilities.SearchByPhone)) {
                        return res.status(403).end();
                    }

                    this.dataBaseService.getFile(data.fileId, data => {
                        phones = data.result[0].Content;
                        loadUserInfo(0);
                    });
                    return res.status(200).end();

                    return;
                } else if (data.resultId) {
                    if (!hasCapability(req, capabilities.PeoplesToExcel)) {
                        return res.status(403).end();
                    }
                    this.dataBaseService.getFileByRequestId(data.resultId, data => {
                        var sheet = data.result.Content;
                        //console.log(`data: ${JSON.stringify(sheet)}`);

                        var file = nodeExcel.execute([sheet]);
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader("Content-Disposition", `attachment; filename=${encodeURI(data.result.Name)}.xlsx`);
                        res.setHeader("Cache-Control", `no-cache`);
                        return res.end(file, 'binary');
                    });
                    return;
                } else {
                    return;
                }

                loadUserInfo(0);
                return res.status(200).end();

                function loadUserInfo(ind) {
                    if (ind == phones.length) {
                        if (sheet == null) {
                            return res.status(500).end();
                        }
                        logger.info(`sheet`);

                        logger.info(`return file`);
                        /*var file = nodeExcel.execute(sheet);
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader("Content-Disposition", `attachment; filename=phones.xlsx`);
                        res.setHeader("Cache-Control", `no-cache`);*/

                        self.dataBaseService.saveJsonFile(JSON.stringify(sheet), null, responce => {
                            // create result
                            self.dataBaseService.createResult(req.session.user_id, data.name, ResultTypes[requestType.usersByPhones.toLowerCase()], id => {
                                console.log(JSON.stringify(sheet));
                                self.dataBaseService.saveResults(id, { fileId: responce.result, phonesCount: phones.length }, sheet[0].rows.length);
                                self.dataBaseService.updateResultProgress(id, 100);
                            });
                        });

                        return;
                       // return res.end(file, 'binary');
                    }

                    socialStorageService.getUserByPhone({ phone: phones[ind], phones: phones, hash_type: hash }, result => {
                        logger.info(`socialStorageService.getUserByPhone`);

                        if (sheet == null) {
                            sheet = result;
                        } else if (result[0].rows[0].filter(r => r.trim(' ').length > 0).length > 0) {
                            sheet[0].rows.push(result[0].rows[0]);
                        }

                        loadUserInfo(ind + 1); //phones.length);
                    });
                }
            });

            this.app.post('/analisys', bodyParser.json({ limit: '50mb', extended: true }), (req, res) => {
                logger.info(`post - analisys: ${req.session.userId}, capabilities: ${req.session.capabilities}`);
                if (!req.session.userId) {
                    return res.status(401).end();
                }

                logger.info(`req.session.capabilities: ${req.session.capabilities}`);
                logger.info(`capabilities.Segmentation: ${capabilities.Analisys}`);

                if (!hasCapability(req, capabilities.Analisys)) {
                    return res.status(403).end();
                }

                var context = {
                    data: req.body.data.groupId,
                    userId: req.session.user_id,
                    name: req.body.data.name,
                    requestType: ResultTypes[requestType.analisys],
                    notificationRequired: req.body.data.notificationRequired == true,
                    sex: req.body.data.sex || 0,
                    resultId: req.body.data.resultId
                };

                if (req.body.data.groupId == null && req.body.data.resultId != null) {
                    this.dataBaseService.getRequest(req.body.data.resultId, (data) => {
                        context.data = data;
                        this.createRequest(context);
                    });
                    return;
                }

                this.createRequest(context);
                res.status(200).end();
            });

            this.app.post('/segment', bodyParser.json({ limit: '50mb', extended: true }), (req, res) => {
                logger.info('post - segment');
                if (!req.session.userId) {
                    return res.redirect('/');
                }

                logger.info(`req.session.capabilities: ${req.session.capabilities}`);
                logger.info(`capabilities.Segmentation: ${capabilities.Segmentation}`);

                if (!hasCapability(req, capabilities.Segmentation)) {
                    return res.status(403).end();
                }

                var context = {
                    data: req.body.data.groupId,
                    userId: req.session.user_id,
                    name: req.body.data.name,
                    requestType: ResultTypes[requestType.segment],
                    notificationRequired: req.body.data.notificationRequired == true,
                    sex: req.body.data.sex
                };

                this.createRequest(context);
                res.status(200).end();
            });
        }

        createOrUpdateRequest(filter, model, callback) {
            let propertyNames = Object.getOwnPropertyNames(model);
            // console.log(`propNames: ${propertyNames}`);
            this.dataBaseService.getFilteredRequest(filter, request => {

                /*  if (request == null) {
                      this.dataBaseService.createResult(model.userId, model.name, model.requestType, (resultId) => {
                          if (resultId == null) {
                              this.SendNotification(`запрос ${model.name} завершился с ошибкой`, model.userId, resultId);
                              return;
                          }
  
                          if (model.notificationRequired) {
                              this.dataBaseService.createOrUpdateResultNotifications(resultId, false);
                          }
  
                          this.dataBaseService.saveRequest(model, resultId, () => {
                              this.dataBaseService.isQueueEmpty(context.userId, queueEmpty => {
                                  //        // console.log(`queueEmpty: ${queueEmpty}`);
                                  if (queueEmpty) {
                                      this.executionLoop(context.userId);
                                  }
                              });
                          });
                      });
                  } else {*/
                let context = request.Context;
                propertyNames.forEach(property => {
                    request.Context[property] = model[property];
                });

                this.dataBaseService.updateRequest(request.Context, request.Result_Id, () => {
                    this.dataBaseService.isQueueEmpty(context.userId, queueEmpty => {
                        // console.log(`queueEmpty: ${queueEmpty}`);
                        if (queueEmpty) {
                            this.executionLoop(context.userId);
                        }
                    });
                    callback && callback();
                });
                //   }
            })
        }

        /**
         * request {
         *  Context: context
         * }
         * context = {
         *           userId: int,
         *           sourceGroupId: int[] | string,
         *           targetGroupId: int[] | string,
         *           name: string,
         *           notificationRequired: bool,
         *           guid: Guid
         *       }
         */
        executeLookALike(request) {
            let count = 0;
            // console.log(`executeLookALike request.Context.targetGroupId (${JSON.stringify(request.Context.targetGroupId)}`);
            this.getUserIds(request.Context.sourceGroupId, request.Result_Id, request.Context.userId, null, sourceUserIds => {
                this.getUserIds(request.Context.targetGroupId, request.Result_Id, request.Context.userId, null, targetUserIds => {
                    let context = { resultId: request.Result_Id, userId: request.Context.userId };

                    const saveUserIdsCallback = function (idCount) {
                        this.verifyLicenseAndRun(request.Context, request.Result_Id, idCount, this.runAnalisys.bind(this));
                    }

                    let saveUserIdsHandler = this.saveUsers.bind(this, saveUserIdsCallback.bind(this), context);

                    //        // console.log(`executeLookALike: ${count++}`);
                    socialStorageService.getLookALike({
                        sourceUserIds,
                        targetUserIds,
                        resultId: request.Result_Id,
                        count: request.Context.count,
                        sex: request.Context.sex
                    }, saveUserIdsHandler);

                    sourceUserIds.length = 0;
                    targetUserIds.length = 0;
                });
            });
        }

        getQueue(data, userId) {
            logger.info(`getQueue(data: ${data}, userId: ${userId})`);
            //   // console.log(`getQueue(data: ${data}, userId: ${userId})`);
            this.dataBaseService.getQueue(userId, queue => {
                this.sendMessage({
                    type: 'queueResult',
                    text: JSON.stringify(queue)
                }, userId);
            });
        }

        sendMessage(data, userId) {
            (webSockets[userId] || []).forEach(socket => {
                try {
                    socket.send(JSON.stringify(data));
                } catch (ex) {
                    // console.log('SendNotification: error');
                    // console.log(ex);

                    logger.error('SendNotification: error');
                    logger.error(ex);
                }
            });
        }

        SendNotification(text, userId = 0, resultId = 0) {
            logger.info('web soket has been opened');
            logger.info(`userId: ${userId}, resultId: ${resultId}`);

            this.sendEmail(`${text}. Перейти к результату: ${this.baseUrl}/results/${resultId}`, userId, resultId);
        }

        sendEmail(text, userId, resultId) {
            this.dataBaseService.isNotificationRequired(resultId, (notificationSent) => {
                if (notificationSent === false) {
                    this.dataBaseService.getUserEmail(userId, email => {
                        logger.info(`email: ${email}`);
                        mailService.send(email, 'запрос выполнился', text);

                        this.dataBaseService.createOrUpdateResultNotifications(resultId, true);
                    });
                }
            });
        }

        /**
         * context = {
         *           data: groupId or text,
         *           userId: int,
         *           name: string,
         *           requestType: ResultTypes,
         *           notificationRequired: req.body.data.notificationRequired,
         *           sex: req.body.data.sex || 0,
         *           resultId: req.body.data.resultId
         *       } 
        */
        createRequest(context, callback) {
            logger.info(`createRequest(context: ${JSON.stringify(context)})`);
            this.dataBaseService.createResult(context.userId, context.name, context.requestType, (resultId) => {

                if (resultId == null) {
                    this.SendNotification(`запрос ${context.name} завершился с ошибкой`, context.userId, resultId);
                    return;
                }

                if (context.notificationRequired) {
                    this.dataBaseService.createOrUpdateResultNotifications(resultId, false);
                }

                this.dataBaseService.saveRequest(context, resultId, success => {
                    if (!success) {
                        this.SendNotification(`произошла ошибка во время получения списка id пользователей. Имя запроса: ${context.name}`, context.userId, resultId);
                        this.dataBaseService.updateResultProgress(resultId, 100);
                        this.dataBaseService.updateRequestStatus(resultId, 'suspended');
                    }

                    this.dataBaseService.isQueueEmpty(context.userId, queueEmpty => {
                        //        // console.log(`queueEmpty: ${queueEmpty}`);
                        if (queueEmpty) {
                            this.executionLoop(context.userId);
                        }
                        callback && callback();
                    });
                });
            },
                (error) => {
                    logger.error('executeAction - error');
                    logger.error(error);
                });
        }

        executionLoop(userId) {
            this.dataBaseService.getNextRequest(userId, request => {
                //    // console.log(`executionLoop: ${JSON.stringify(request)}`);
                this.dataBaseService.updateRequestStatus(request.Result_Id, 'busy');

                var action;
                switch (request.Context.requestType) {
                    case ResultTypesEntity[requestType.analisys]:
                        action = this.runAnalisys.bind(this);
                        break;
                    case ResultTypesEntity[requestType.segment]:
                        action = this.runSegmentation.bind(this);
                        break;
                    case ResultTypesEntity[requestType.lookALike]:
                        this.executeLookALike(request);
                        return;
                        break;
                }

                this.executeAction(request.Context, request.Result_Id, action);
            });
        }

        rerunAction(request) {
            //      // console.log(`reranAction ${JSON.stringify(request)}`);
            var action;
            switch (request.Context.requestType) {
                case ResultTypesEntity[requestType.analisys]:
                    action = this.runAnalisys.bind(this);
                    break;
                case ResultTypesEntity[requestType.segment]:
                    action = this.runSegmentation.bind(this);
                    break;
                case ResultTypesEntity[requestType.lookALike]:
                    this.executeLookALike(request);
                    return;
                    break;
            }

            request.Context.rerun = true;

            this.executeAction(request.Context, request.Result_Id, action);
        }

        executeAction(context, resultId, action) {
            logger.info(`executeAction (context: , resultId: ${resultId})`);
            this.getUserIds(context.data, resultId, context.userId, callback.bind(this));

            function callback(idCount) {
                if (idCount == null || idCount == 0) {
                    logger.error('executeAction - error (ids == null)');
                    this.SendNotification(`произошла ошибка во время получения списка id пользователей. Имя запроса: ${context.name}`, context.userId, resultId);
                    this.executionLoop(context.userId);
                    this.dataBaseService.updateResultProgress(resultId, 100);
                    this.dataBaseService.updateRequestStatus(resultId, 'suspended');
                    return;
                }

                logger.info(`executeAction - callback(ids: ${idCount})`);
                //      // console.log(`executeAction - callback(ids: ${idCount})`);

                this.verifyLicenseAndRun(context, resultId, idCount, action);
            }
        }

        verifyLicenseAndRun(context, resultId, idCount, action) {
            console.log(`verifyLicenseAndRun(context.rerun: ${context.rerun}, resultId: ${resultId}, idCount: ${idCount}`);

            this.dataBaseService.getUserLicense(context.userId, (license) => {
                logger.info(`verifyLicenseAndRun: license: ${JSON.stringify(license)}`);
                console.log(`verifyLicenseAndRun: license: ${JSON.stringify(license)}`);
                if (context.rerun) {
                    action(context.userId, context.name, resultId, idCount, context.sex);
                    return;
                }

                if (license == null) {
                    let message = `message: у вас нет активной подписки`;
                    this.dataBaseService.createActivity(context.userId, message, (callback) => this.dataBaseService.getResult(resultId, context.userId, 0, callback));
                    this.dataBaseService.updateResultProgress(resultId, 100);
                    this.SendNotification(message, context.userId, resultId);
                    this.dataBaseService.markBrokenResult(resultId);
                    this.dataBaseService.updateRequestStatus(resultId, 'suspended');
                    return;
                }

                if (license.Requests >= idCount && (license.TotalRequestLimit == null || license.TotalRequestLimit >= idCount) || containsCapability(license.Capabilities, capabilities.Admin)) {
                    action(context.userId, context.name, resultId, idCount, context.sex);

                    if (!containsCapability(license.Capabilities, capabilities.Admin) && license.TotalRequestLimit != null) {
                        this.dataBaseService.reduceTotalRequestLimit(license.User_Id, idCount);
                    }
                } else {
                    let message = `message: вашей лицензии не достаточно для обработки ${idCount} пользователей \r\n result Id: ${resultId}`;
                    this.dataBaseService.createActivity(context.userId, message, (callback) => this.dataBaseService.getResult(resultId, context.userId, 0, callback));
                    this.dataBaseService.updateResultProgress(resultId, 100);
                    this.SendNotification(message, context.userId, resultId);
                    this.dataBaseService.markBrokenResult(resultId);
                    this.dataBaseService.updateRequestStatus(resultId, 'suspended');
                    this.executionLoop(context.userId);
                }
            });
        }

        errorCallback(userId, resultId, message) {
            this.dataBaseService.createActivity(userId, message, (callback) => this.dataBaseService.getResult(resultId, userId, 1, callback));
            this.dataBaseService.updateResultProgress(resultId, 100);
            this.SendNotification(message, userId, resultId);
            this.dataBaseService.markBrokenResult(resultId);
            this.dataBaseService.updateRequestStatus(resultId, 'suspended');
            this.dataBaseService.saveResults(resultId, { error: message }, 0);

            this.executionLoop(userId);
        }

        getUserIds(text, resultId, userId, proceedCallback, saveUsersCallback) {
            //console.log(`getUserIds(text: ${text}, resultId: ${resultId})`);
            logger.info(`getUserIds(text: , resultId: ${resultId})`);

            if (text == null) {
                let message = `запрос ${resultId} не содержит пользователей для обработки`;
                this.errorCallback(userId, resultId, message);
                return;
            }

            const idList = text.split ? text.split(/[\s,\r\n]+/).filter(v => v.trim() != '') : text.trim;

            if (idList.length == 0) {
                let message = `запрос ${resultId} не содержит пользователей для обработки`;
                this.errorCallback(userId, resultId, message);
            }

            //       // console.log(`getUserIds(idList: ${idList}, resultId: ${resultId})`);
            var isGroup = idList.length == 1;

            logger.info('getUserIds: ' + idList.length);
            console.log('getUserIds: ' + idList.length);

            var itemsToParse = [];
            var readyItems = [];

            const testCount = idList.length;

            for (let k = 0; k < idList.length && k < testCount; k++) {
                if (Number(idList[k])) {
                    if (Number(idList[k]) > 0) {
                        readyItems.push(idList[k]);
                    }
                } else {
                    // logger.info(`itemsToParse.push : ${idList[k]}`);
                    itemsToParse.push(idList[k]);
                }
            }

            const saveUsersHandler = saveUsersCallback || this.saveUsers.bind(this, proceedCallback, { userId, resultId });

            if (isGroup) {
                var groupId = this.getScreenName(idList);
                logger.info('groupId: ' + groupId);

                let groupMemberIds = [];

                VK.call('groups.getMembers', {
                    group_id: groupId[0],
                    offset: 0,
                    access_token: '9371f1de9371f1de9371f1de7893230170993719371f1deca6b0c23541a058573bbf986'
                }).then(res => {
                    const membersCount = res.count;
                    if (!res.count) {
                        this.proceedWithUsers(readyItems, testCount, itemsToParse, saveUsersHandler);
                        return;
                    }
                    let processed = 0;
                    for (let i = 0; i < membersCount; i += 1000) {
                        VK.call('groups.getMembers', {
                            group_id: groupId[0],
                            offset: i,
                            access_token: '9371f1de9371f1de9371f1de7893230170993719371f1deca6b0c23541a058573bbf986'
                        }).then(res => {
                            processed += 1000;
                            groupMemberIds = groupMemberIds.concat(res.items);

                            if (membersCount <= processed) {
                                saveUsersHandler(groupMemberIds);
                                return;
                            }
                        },
                            () => {
                                logger.info('error!!');
                                logger.info(arguments);
                                this.proceedWithUsers(readyItems, testCount, itemsToParse, saveUsersHandler);
                            });
                    }
                },
                    () => {
                        logger.info('error!!');
                        logger.info(arguments);
                        this.proceedWithUsers(readyItems, testCount, itemsToParse, saveUsersHandler);
                    });
            } else {
                this.proceedWithUsers(readyItems, testCount, itemsToParse, saveUsersHandler);
            }
        }

        /**
         * 
         * @param {function(number):void} proceedCallback 
         * @param {{userId: number, resultId: number}} context 
         * @param {number[]} ids 
         */
        saveUsers(proceedCallback, context, ids) {
            if (ids == null) {
                this.dataBaseService.updateResultProgress(context.resultId, 100);
                this.dataBaseService.updateRequestStatus(context.resultId, 'suspended');
                this.dataBaseService.markBrokenResult(context.resultId);

                let message = `запрос c id ${context.resultId} не обнаружил пользователей для обработки`;

                this.SendNotification(message, context.userId, context.resultId);

                // saves the error
                this.dataBaseService.saveResults(context.resultId, { error: message }, 0);

                this.executionLoop(context.userId);
                return;
            }

            const step = 5000, length = ids.length;
            //      // console.log(`save users: ${ids.length}, context: ${JSON.stringify(context)}`);

            for (let i = 0; i < ids.length; i += step) {
                var data = ids.slice(i, Math.min(i + step, ids.length));
                this.dataBaseService.addUsersForProcessing(context.resultId, data, () => {
                    if (i + step >= length) {
                        proceedCallback(length);
                    }
                });
            }

            ids.length = 0;
        }

        proceedWithUsers(readyItems, testCount, itemsToParse, callback) {
            logger.info('proceedWithUsers');
            const length = itemsToParse.length;

            if (readyItems.length == testCount) {
                callback(readyItems);
                return;
            }
            // logger.info(`itemsToParse: ${itemsToParse}`);

            for (let j = 0; j < length; j = Math.min(j + 100, length)) {
                var data = itemsToParse.slice(j, Math.min(j + 100, length));
                var param = this.getScreenName(data).join(',');

                //logger.info(`user_ids: ${param}`);

                VK.call('users.get', {
                    user_ids: param,
                    access_token: '9371f1de9371f1de9371f1de7893230170993719371f1deca6b0c23541a058573bbf986'
                }).then(res => {
                    //            // console.log(res);
                    for (let i = 0; i < res.length; i++) {
                        if (res[i].error_code == null && res[i].id != null) {
                            readyItems.push(res[i].id);
                        }
                    }

                    if (j + 100 >= itemsToParse.length) {
                        if (readyItems.length == 0) {
                            callback(null);
                        } else {
                            callback(readyItems);
                        }
                    }
                }, error => {
                    logger.error(`proceedWithUsers: ${JSON.stringify(error)} \r\n ${param}`);
                    callback(null);
                });
            }
        }

        getScreenName(urls) {
            const reservedWords = ['public', 'group', 'event', 'club'];
            logger.info(`getScreenName: `);
            let result = [];

            for (let i = 0; i < urls.length; i++) {
                var subStrings = urls[i].split('/'),
                    name = subStrings[subStrings.length - 1].trim();

                reservedWords.forEach(value => {
                    name = this.getEntityId(name, value);
                })

                if (name.indexOf('club') == 0) {
                    let urlEnd = name.substring(4, name.length);
                }

                result.push(name);
            }

            return result;
        }

        getEntityId(name, word) {
            if (name.indexOf(word) == 0) {
                let urlEnd = name.substring(word.length, name.length);

                if (parseInt(urlEnd)) {
                    name = urlEnd;
                }
            }

            return name;
        }

        runAnalisys(userId, resultName, resultId, idCount, sex = 0) {
            logger.info(`runAnalisys(userId, name, resultId): ${userId}, ${resultName}, ${resultId}`);

            /*if (ids == null) {
                this.dataBaseService.markBrokenResult(resultId);
                this.SendNotification(`запрос ${name} завершился с ошибкой`, userId, resultId);
                return;
            }*/


            let analisysResult = {}, count = 0, analisysResultCounts = {};
            const beginHandler = begin.bind(this, idCount),
                getUserIdsAndExecuteHandler = getUserIdsAndExecute.bind(this);
            getUserIdsAndExecuteHandler();

            function getUserIdsAndExecute() {
                this.dataBaseService.getUsersForProcessing(resultId, beginHandler);
            }

            function begin(idCount, ids) {
                if (ids == null) {
                    this.dataBaseService.updateResultProgress(resultId, 100);
                    this.sendMessage({
                        type: 'updateProgress',
                        text: JSON.stringify({
                            progress: 100,
                            resultId,
                            resultName
                        })
                    }, userId);
                    this.dataBaseService.saveResults(resultId, analisysResult, idCount);
                    this.SendNotification(`запрос ${resultName} успешно завершился`, userId, resultId);
                    this.executionLoop(userId);
                    this.dataBaseService.updateRequestStatus(resultId, 'finished');
                    return;
                }
                logger.info(`begin: ${ids.length}, resultId: ${resultId}`);

                const step = 5000;
                this.dataBaseService.updateResultProgress(resultId, ((count * 100) / idCount) % 100);
                this.sendMessage({
                    type: 'updateProgress',
                    text: JSON.stringify({
                        progress: ((count * 100) / idCount) % 100,
                        resultId,
                        resultName
                    })
                }, userId);

                var sheet;
                this.dataBaseService.getFileByRequestId(resultId, d => sheet = d);
                var sheetGetter = function () { return sheet };

                try {
                    socialStorageService.getStats(ids, resultId, sex, sheetGetter, (result, sheets) => {
                        logger.info(`socialStorageService.getStats (result id: ${resultId})`);
                        if (result == null) {
                            this.dataBaseService.markBrokenResult(resultId);
                            this.SendNotification(`запрос ${resultName} завершился с ошибкой`, userId, resultId);
                            logger.info(`socialStorageService.getStats - restore requests (${idCount})`);
                            this.dataBaseService.restoreRequests(userId, idCount, (message) => {
                                //       this.SendNotification(message, userId, resultId);
                                this.dataBaseService.updateResultProgress(resultId, 100);
                                this.executionLoop(userId);
                                this.dataBaseService.updateRequestStatus(resultId, 'suspended');
                            }, (message) => {
                                //         this.SendNotification(message, userId, resultId);
                            });
                        }
                        logger.info('getStats');

                        this.dataBaseService.updateFileByRequestId(resultId, sheets, () => null);

                        let segments = result.stats.segments;
                        result = result.stats.stats;
                        let propNames = Object.getOwnPropertyNames(result);
                        count += step;

                        if (segments) {
                            if (segments[Ages[0]] != undefined) {
                                this.processAges(resultId, segments);
                            } else {
                                this.processMbti(resultId, segments);
                            }
                        }

                        if (analisysResult['city_stat'] == undefined) {
                            // first result
                            analisysResult = result;
                        } else {

                            this.joinPopularGroups(analisysResult["city_stat"], result["city_stat"]);
                            this.joinBday(analisysResult["bday_stat"], result["bday_stat"]);

                            this.joinPopularGroups(analisysResult["popular_groups_stat"], result["popular_groups_stat"]);
                            this.joinPopularGroups(analisysResult["interests"], result["interests"]);
                            this.joinPopularGroups(analisysResult["people_main_stat"], result["people_main_stat"]);
                            this.joinPopularGroups(analisysResult["life_main_stat"], result["life_main_stat"]);
                            this.joinPopularGroups(analisysResult["country_stat"], result["country_stat"]);
                            this.joinPopularGroups(analisysResult["relation_stat"], result["relation_stat"]);
                            this.joinPopularGroups(analisysResult["mbti_stat"], result["mbti_stat"]);
                            this.joinSex(analisysResult["sex_stat"], result["sex_stat"]);
                            //      // console.log(analisysResult);
                        }

                        // add result to analisysResult
                        getUserIdsAndExecuteHandler();
                    }, (error) => {
                        logger.error('runAnalisys - error');
                        logger.error(error);
                        this.SendNotification(`запрос ${resultName} завершился с ошибкой`, userId, resultId);
                        this.dataBaseService.markBrokenResult(resultId);
                        this.dataBaseService.restoreRequests(userId, /*ids.length*/idCount, (message) => {
                            //      this.SendNotification(message, userId, resultId);
                            this.executionLoop(userId);
                            this.dataBaseService.updateResultProgress(resultId, 100);
                            this.dataBaseService.updateRequestStatus(resultId, 'suspended');
                        }, (message) => {
                            //        this.SendNotification(message, userId, resultId);
                        });
                    });
                } catch (err) {
                    logger.error(`runAnalisys - error: userId: ${userId}, resultId: ${resultId}, idCount: ${idCount}`);
                    logger.error(err);
                    this.SendNotification(`запрос ${resultName} завершился с ошибкой`, userId, resultId);
                    this.dataBaseService.markBrokenResult(resultId);
                    this.dataBaseService.restoreRequests(userId, idCount, (message) => {
                        this.executionLoop(userId);
                        this.dataBaseService.updateResultProgress(resultId, 100);
                        this.dataBaseService.updateRequestStatus(resultId, 'suspended');
                    }, (message) => {
                    });

                }

                ids.length = 0;
            }

            function remove(arr, item) {
                for (var i = arr.length; i--;) {
                    if (arr[i] === item) {
                        arr.splice(i, 1);
                    }
                }
            }
        }

        joinSex(obj1, obj2) {
            if (obj2 == null) {
                return;
            }
            const newCount = obj2.count,
                oldCount = obj1.count,
                data = obj2.stats;

            obj1.count += newCount;
            obj1.stats["M"] = (oldCount * obj1.stats["M"] + newCount * data["M"]) / (oldCount + newCount);
            obj1.stats["F"] = (oldCount * obj1.stats["F"] + newCount * data["F"]) / (oldCount + newCount);
        }

        joinPopularGroups(obj1, obj2) {
            if (obj2 == null) {
                return;
            }

            const newCount = obj2.count,
                oldCount = obj1.count,
                data = obj2.stats;

            obj1.count += newCount;

            for (let i = 0; i < data.length; i++) {
                let propName = Object.getOwnPropertyNames(data[i])[0],
                    added = false;

                for (let j = 0; j < obj1.stats.length && !added; j++) {
                    let oldPropName = Object.getOwnPropertyNames(obj1.stats[j])[0];

                    if (propName == oldPropName) {
                        let newValue = (data[i][propName]),
                            oldValue = (obj1.stats[j][propName]);

                        obj1.stats[j][oldPropName] = (oldCount * oldValue + newCount * newValue) * 1.0 / (oldCount + newCount);
                        added = true;
                    }
                }

                if (!added) {
                    let updatedValue = {};
                    updatedValue[propName] = data[i][propName];
                    obj1.stats.push(updatedValue);
                }
            }
        }

        joinBday(obj1, obj2) {
            if (obj2 == null) {
                return;
            }

            const newCount = obj2.count,
                oldCount = obj1.count,
                data = obj2.stats.distribution;

            obj1.count += newCount;

            const propNames = Object.getOwnPropertyNames(data);

            for (let i = 0; i < propNames.length; i++) {
                let propName = propNames[i],
                    added = false,
                    oldPropNames = Object.getOwnPropertyNames(obj1.stats.distribution);

                for (let j = 0; j < oldPropNames.length && !added; j++) {
                    let oldPropName = oldPropNames[j];

                    if (propName == oldPropName) {
                        let newValue = (data[oldPropName]);

                        obj1.stats.distribution[oldPropName] += newValue;
                        added = true;
                    }
                }

                if (!added) {
                    obj1.stats.distribution[propName] = data[propName];
                }
            }
        }

        joinCity(obj1, obj2) {
            if (obj2 == null) {
                return;
            }

            const newCount = obj2.count,
                oldCount = obj1.count;

            obj1.count += newCount;

            for (let i = 0; i < obj2.stats.length; i++) {
                let newCityName = Object.getOwnPropertyNames(obj2.stats[i])[0],
                    added = false;

                for (let j = 0; j < obj1.stats.length && !added; j++) {
                    let oldCityName = Object.getOwnPropertyNames(obj1.stats[j])[0];
                    if (oldCityName == newCityName) {
                        let oldValue = (obj1.stats[j][oldCityName]),
                            newValue = (obj2.stats[i][oldCityName]);

                        obj1.stats[j][oldCityName] = (oldCount * oldValue + newCount * newValue) / (oldCount + newCount);
                        added = true;
                    }
                }

                if (!added) {
                    let updatedValue = {};
                    updatedValue[newCityName] = obj2.stats[i][newCityName];
                    obj1.stats.push(updatedValue);
                }
            }
        }

        runSegmentation(userId, resultName, resultId, id_Count) {
            logger.info(`runSegmentation( userId: ${userId}, name: ${resultName}, resultId: ${resultId}, idCount: ${id_Count})`);

            /* if (ids == null) {
                 this.dataBaseService.markBrokenResult(resultId);
                 this.SendNotification(`запрос ${resultName} завершился с ошибкой`, userId, resultId);
                 logger.error(`Error: runSegmentation( userId: ${userId}, name: ${resultName}, ids: ${ids}, resultId: ${resultId})`);
                 return;
         }*/

            let count = 0;

            const beginHandler = begin.bind(this, id_Count),
                getUserIdsAndExecuteHandler = getUserIdsAndExecute.bind(this);

            getUserIdsAndExecuteHandler();

            function getUserIdsAndExecute() {
                this.dataBaseService.getUsersForProcessing(resultId, beginHandler);
            }

            function begin(idCount, ids) {
                if (ids == null) {
                    this.dataBaseService.saveResults(resultId, {}, idCount);
                    this.dataBaseService.updateResultProgress(resultId, 100);
                    this.sendMessage({
                        type: 'updateProgress',
                        text: JSON.stringify({
                            progress: 100,
                            resultId,
                            resultName
                        })
                    }, userId);
                    this.SendNotification(`запрос ${resultName} успешно завершился`, userId, resultId);
                    this.executionLoop(userId);
                    this.dataBaseService.updateRequestStatus(resultId, 'finished');
                    return;
                }

                //        // console.log('begin:' + ids.length);
                //      // console.log('idCount:' + idCount);

                this.dataBaseService.updateResultProgress(resultId, ((count * 100) / idCount) % 100);
                this.sendMessage({
                    type: 'updateProgress',
                    text: JSON.stringify({
                        progress: ((count * 100) / idCount) % 100,
                        resultId,
                        resultName
                    })
                }, userId);

                const step = 5000;
                try {
                    socialStorageService.getMbtiMap(ids, resultId, (result) => {
                        //            // console.log('socialStorageService.getMbtiMap:');
                        if (result == null) {
                            this.dataBaseService.markBrokenResult(resultId);
                            this.SendNotification(`запрос ${name} завершился с ошибкой`, userId, resultId);
                            this.executionLoop(userId);
                            this.dataBaseService.updateResultProgress(resultId, 100);
                            this.dataBaseService.updateRequestStatus(resultId, 'suspended');

                            this.dataBaseService.restoreRequests(userId, idCount, (message) => {
                                this.SendNotification(message, userId, resultId);
                            }, (message) => {
                                this.SendNotification(message, userId, resultId);
                            });
                        } else {
                            let currentResult = result.segments;

                            if (currentResult[Ages[0]] != undefined) {
                                this.processAges(resultId, currentResult);
                            } else {
                                this.processMbti(resultId, currentResult);
                            }
                            count += step;

                            ids.length = 0;
                            getUserIdsAndExecuteHandler();
                        }
                    },
                        (error) => {
                            consoloe.log('runSegmentation - error');
                            consoloe.log(error);
                            this.dataBaseService.markBrokenResult(resultId);
                            this.SendNotification(`запрос ${resultName} завершился с ошибкой`, userId, resultId);

                            this.dataBaseService.restoreRequests(userId, idCount, (message) => {
                                this.executionLoop(userId);
                                this.dataBaseService.updateResultProgress(resultId, 100);
                                this.dataBaseService.updateRequestStatus(resultId, 'suspended');
                            }, (message) => {
                            })
                        });
                } catch (err) {
                    consoloe.log('runSegmentation - error');
                    consoloe.log(error);
                    this.dataBaseService.markBrokenResult(resultId);
                    this.SendNotification(`запрос ${resultName} завершился с ошибкой`, userId, resultId);

                    this.dataBaseService.restoreRequests(userId, idCount, (message) => {
                        this.executionLoop(userId);
                        this.dataBaseService.updateResultProgress(resultId, 100);
                        this.dataBaseService.updateRequestStatus(resultId, 'suspended');
                    }, (message) => {
                    })

                }
            }
        }

        processMbti(resultId, segments) {
            MbtiTypes.forEach(mbtiType => {
                this.createOrUpdateSegment(resultId, mbtiType, '', segments[mbtiType])
            });
        }

        processAges(resultId, segments) {
            Ages.forEach(age => {
                this.processMbti(resultId, segments[age]);
            });

        }

        createOrUpdateSegment(resultId, type, age, userIds) {
            logger.info(`createOrUpdateSegment(resultId: ${resultId}, type: ${type}, age: ${age})`);
            this.dataBaseService.getSegment(resultId, [type], age, segments => {
                if (segments.length == 0) {
                    // create segments
                    this.dataBaseService.createSegment(resultId, type, userIds, age);
                } else {
                    //update segments
                    this.dataBaseService.updateSegment(resultId, type, userIds, age);
                }
            })
        }
    }

    function hasCapability(req, capability) {
        return !!(req.session.capabilities & capabilities.Admin) || !!(req.session.capabilities & capability);
    }

    function containsCapability(capabilities, capability) {
        return !!(capabilities & capabilities.Admin) || !!(capabilities & capability);
    }

    module.exports = AnalisysController;
})(module.exports, null, module);