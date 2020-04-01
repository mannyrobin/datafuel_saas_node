'use strict';

var pg = require('pg');
var winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: './logs/data-base-data-fuel.log',
            maxsize: 1024 * 1024 * 10,
            maxFiles: 10,
            json: false,
            eol: '\r\n'
        })
    ]
});

(function (exports, require, module) {
    const config = {
        user: 'detafuel', //env var: PGUSER
        database: 'DataFuelDb', //env var: PGDATABASE
        password: 'Plmnji1@', //env var: PGPASSWORD 
        host: '51.159.26.58', // Server hosting the postgres database
        port: 65279, //env var: PGPORT
        max: 0, // max number of clients in the pool
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    }
    var pool = new pg.Pool(config),
        ResultTypes = {};

    class DataFuelDb {
        constructor() {
            logger.info('constructor');
        }

        static getSpecialPromos(callback) {
            logger.info(`Strting getSpecialPromos()`);

            pool.query('SELECT * FROM "SpecialPromo"', (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.error(`finished getSpecialPromos()`);
                    return;
                }

                logger.info(`finished getSpecialPromos()`);
                callback(result.rows);
            });
        }

        static getQueue(userId, callback) {
            logger.info(`Strting getQueue(userId: ${userId})`);

            pool.query('SELECT "Name", "Progress", "Id", "CreatedOn" FROM "Results" WHERE "User_Id" = $1 AND ("Progress" < 100 OR "Progress" IS NULL) AND NOT "Broken" AND NOT "Deleted" order by "Progress" asc', [userId], (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.error(`finished getQueue(userId: ${userId})`)
                    return;
                }

                callback(result.rows);
            });
        }

        static saveRequest(context, resultId, callback) {
            logger.info(`Starting saveRequest(context: ${JSON.stringify(context)}, resultId: ${resultId})`);
            pool.query('insert into "Requests" ("User_Id", "Body", "Result_Id", "Context", "Status", "Guid") values ($1, $2, $3, $4, $5, $6)', [context.userId, context.data || null, resultId, context, 'idle', context.guid], (error) => {
                if (error) {
                    logger.error(`error saveRequest(context: ${JSON.stringify(context)}, resultId: ${resultId})`);
                    logger.error(error);
                    callback(false);
                    return;
                }

                callback(true);
            });
        }

        static updateRequest(context, resultId, callback) {
            logger.info(`Starting saveRequest(context: ${JSON.stringify(context)}, resultId: ${resultId})`);
            pool.query('update "Requests" set "Context" = $1 where "Result_Id" = $2', [context, resultId], (error) => {
                if (error) {
                    logger.error(`error saveRequest(context: ${JSON.stringify(context)}, resultId: ${resultId})`);
                    logger.error(error);
                }

                callback();
            });
        }

        static getNextRequest(userId, callback) {
            logger.info(`getNextRequest(userId: ${userId})`);

            pool.query(`SELECT "Context", "Result_Id" FROM "Requests" WHERE "User_Id" = $1 AND "Status" = $2 AND (("Guid") is null OR ("Context"->>'sourceGroupId')::text != '' AND ("Context"->>'targetGroupId')::text != '') limit 1`, [userId, 'idle'], (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.error(`finished getNextRequest(userId: ${userId})`);
                    return;
                }
                logger.info(`finished getNextRequest(userId: ${userId})`);

                // console.log(JSON.stringify(result.rows));
                if (result.rows.length > 0) {
                    callback(result.rows[0]);
                }
            });
        }

        static getRequestWithStatus(status, callback) {
            logger.info(`starting getRequestWIthStatus(status: ${status})`);

            pool.query('SELECT * FROM "Requests" WHERE "Status" = $1', [status], (error, result) => {
                if (error) {
                    logger.info(error);
                    logger.error(`finished getRequestWIthStatus(status: ${status})`);
                }

                logger.info(`finished getRequestWIthStatus(ustatus: ${status})`);
                if (result.rows.length > 0) {
                    callback(result.rows);
                }
            })
        }

        /**
         * filter = {
         * guid: string
         * }
         */
        static getFilteredRequest(filter, callback) {
            logger.info(`starting getFilteredRequest(filter: ${JSON.stringify(filter)})`);
            let query = 'SELECT * FROM "Requests" WHERE';
            let params = [], index = 1;

            if (filter.guid) {
                params.push(filter.guid);
                query += `"Guid" = $${index++}`;
            }

            logger.info(`getFilteredRequest(filter: ${JSON.stringify(filter)}) : query = ${query}`);
            pool.query(query, params, (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.error(`getFilteredRequest(filter: ${JSON.stringify(filter)})`);
                    callback(null);
                    return;
                }

                callback(result.rows[0]);
            });

        }

        static updateRequestStatus(resultId, status) {
            logger.info(`update request status (resultId: ${resultId}, status: ${status})`);
            pool.query('UPDATE "Requests" SET "Status" = $1 WHERE "Result_Id" = $2', [status, resultId], (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.error(`Finished update request status (resultId: ${resultId}, status: ${status})`);
                    return;
                }

                logger.info(`Finished update request status (resultId: ${resultId}, status: ${status})`);
                DataFuelDb.createActivity(0, `статус реквеста изменен на ${status}`, (callback) => DataFuelDb.getResult(resultId, 1, 1, callback));
            });
        }

        static isQueueEmpty(userId, callback) {
            logger.info(`is queue empty (userId: ${userId})`);
            pool.query('SELECT "Status" from "Requests" WHERE "Status" = $1 AND "User_Id" = $2', ['busy', userId], (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.error(`is queue empty (userId: ${userId})`);
                    callback(true);
                    return;
                }

                callback(result.rows.length == 0);
            });
        }

        static getRequest(resultId, callback) {
            logger.info(`Starting getRequest(userId: resultId: ${resultId})`);

            pool.query('SELECT "Body" FROM "Requests" WHERE "Result_Id" = $1', [resultId], (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.error(`finished getRequest(userId: resultId: ${resultId})`);
                    return;
                }

                logger.info(`finished getRequest(userId: resultId: ${resultId})`);
                callback(result.rows[0].Body);
            });
        }

        static getUsers(callback) {
            logger.info(`Starting getUsers`);
            pool.query('SELECT * FROM "Users"', (error, result) => {
                if (error) {
                    logger.error(`Finished with error: getUsers`);
                    logger.error(error);
                    return
                }

                callback(result.rows);
            });
        }

        /**
         * 
         * @param {number} userId 
         * @param {number} permissions 
         * @param {function({message: string, success: boolean}):void} callback 
         */
        static setPermissions(userId, permissions, callback) {
            logger.info(`Starting setPermissions(userId: ${userId}, permissions: ${permissions})`);
            pool.query(`UPDATE "UserLicense" SET "Capabilities" = "Capabilities" + $1 WHERE "User_Id" = $2`, [permissions, userId], (error) => {
                if (error) {
                    callback({ message: JSON.stringify(error) });
                    logger.error(`setPermissions(userId: ${userId}, permissions: ${permissions})`);
                    logger.error(error);
                    return;
                }

                callback({ message: 'права выданы', success: true })
            })
        }

        static getUsersInfo(callback) {
            logger.info(`Starting getUsers`);
            pool.query(`SELECT  "Users"."UserId", "Users"."Email", "Users"."Name", "Users"."Id", "Users"."UserProfileUrl", "Users"."Money", "Users"."AccountId", "UserLicense"."End_Date", "UserLicense"."Capabilities",
                        "Principal"."TotalRequestLimit", "Principal"."ExportLimit",
"UserLicense"."Rate_Id" , T.TotalRequests as "TotalRequests"
FROM public."Users" 
right join "UserLicense" on "Users"."Id" = "UserLicense"."User_Id" 
inner join "Principal" on "Principal"."Id" = "Users"."Id"
left join
(SELECT "User_Id", sum(Cast("Result"->>'count' as BigInt)) as TotalRequests
	FROM public."Results" where "Result" is not null group by "User_Id") as T on "Users"."Id" = T."User_Id"`,
                (error, result) => {
                    if (error) {
                        logger.error(`Finished with error: getUsersInfo`);
                        logger.error(error);
                        return
                    }

                    callback(result.rows);
                });
        }

        static updateUserProfile(userProfile) {
            logger.info(`Starting updateUserProfile(userProfile: ${JSON.stringify(userProfile)})`);

            pool.query('UPDATE public."Users" SET "Email" = $1, "AccountId" = $2 WHERE "Id" = $3', [userProfile.Email, userProfile.AccountId, userProfile.Id], (error, result) => {
                if (error) {
                    logger.error(error);
                }
                logger.info(`Finished updateUserProfile(userProfile: ${JSON.stringify(userProfile)})`);

                DataFuelDb.createActivity(userProfile.Id, `обновление профайла пользователя: ${JSON.stringify(userProfile)}`);
            });
        }

        static addFeedback(userId, data) {
            logger.info(`addFeedback(data: ${data}, userId: ${userId}`);
            pool.query('INSERT INTO public."Feedbacks" ("User_Id", "Comment") VALUES ($1, $2)', [userId, data], (error, result) => {
                logger.info('addFeedback');
                if (error) {
                    logger.error(error);
                    return;
                }

                logger.info('Finished - addFeedback');
                DataFuelDb.createActivity(userId, `оставлен комментарий: ${data}`);
            });
        }

        static getResultTypes(callback) {
            try {
                pool.query('SELECT * FROM public."ResultType"', (error, result) => {
                    logger.info('getResultTypes - selected');
                    if (error) {
                        logger.error(error);
                        callback(null);
                        return;
                    }

                    for (let i = 0; i < result.rows.length; i++) {
                        ResultTypes[result.rows[i].Name.toLowerCase()] = result.rows[i].Id;
                    };
                    callback(result.rows);
                });
            }
            catch (err) {
                logger.error('getResultTypes');
                logger.error(err);
            }
        }

        static updateUserEmail(userId, email) {
            logger.info(`Starting updateUserEmail(userId: ${userId}, email: ${email})`);

            pool.query('UPDATE public."Users" SET "Email" = $1 WHERE "Id" = $2', [email, userId], (error, result) => {
                if (error) {
                    logger.error(error);
                }

                logger.info(`Finished updateUserEmail(userId: ${userId}, email: ${email})`);

                DataFuelDb.createActivity(userId, `обновление email: ${email}`);
            });
        }

        static getUserEmail(userId, callback) {
            logger.info(`getUserEmail(userId: ${userId})`);
            pool.query('SELECT "Email" FROM public."Users" WHERE "Id" = $1', [userId], (error, result) => {
                if (error) {
                    logger.error(`getUserEmail(userId: ${userId}) \r\n Error`);
                    logger.error(error);
                    logger.info(`Finished with error \r\n getUserEmail(userId: ${userId})`);
                    return;
                }

                if (result.rowCount == 0) {
                    logger.error(`getUserEmail(userId: ${userId}) \r\n Error`);
                    logger.error('the user does not exist');
                    logger.info(`Finished with error \r\n getUserEmail(userId: ${userId})`);
                    return;
                }

                callback(result.rows[0].Email);
            });
        }

        static deleteResult(resultId, userId) {
            logger.info(`deleteResult(resultId: ${resultId})`);
            pool.query('UPDATE public."Results" SET "Deleted" = true WHERE "Id" = $1', [resultId], (error, result) => {
                if (error) {
                    logger.error(`deleteResult(resultId: ${resultId})`);
                    logger.error(error);
                    logger.info(`Finished deleteResult(resultId: ${resultId})`);
                    return;
                }

                logger.info(`Finished deleteResult(resultId: ${resultId})`);
                DataFuelDb.createActivity(userId, `удаление результата с Id: ${resultId}`, (c) => DataFuelDb.getResult(resultId, userId, 0, c));
                DataFuelDb.updateRequestStatus(resultId, 'deleted');
            });
        }

        static updateResultProgress(resultId, progress) {
            logger.info(`updateResultProgress(resultId: ${resultId}, progress: ${progress})`);
            // console.log(`updateResultProgress(resultId: ${resultId}, progress: ${progress})`);
            pool.query('UPDATE "Results" SET "Progress" = $1 WHERE "Id" = $2', [progress, resultId], (error, result) => {
                if (error) {
                    logger.error(`updateResultProgress(resultId: ${resultId}, progress: ${progress})`);
                    logger.error(error);
                    logger.info(`Finished updateResultProgress(resultId: ${resultId}, progress: ${progress})`);
                    return;
                }

                logger.info(`Finished updateResultProgress(resultId: ${resultId}, progress: ${progress})`);
            });
        }

        /**
         * Gets users according to the specified filter.
         * @param {{promo: string, userId: string}} context 
         * @param {function():User} callback 
         */
        static getUsersByFilter(context, callback) {
            logger.info(`Started getUsersByFilter(context: ${context})`);
            let query = `SELECT * FROM "Users" WHERE`;

            if (context.promo) {
                query += ` "Users"."Promo" = '${context.promo}'`;
            }

            if (context.userId) {
                query += ` "Users"."UserId" = '${context.userId}'`;
            }

            logger.info(`Started getUsersByFilter(context: ${context}, query: ${query})`);
            pool.query(query, (error, result) => {
                if (error) {
                    logger.error(error);
                    callback(null);
                    return;
                }

                callback(result.rows);
            });
        }

        /**
         * 
         * @param {string} body 
         * @param {function(string):void} callback 
         */
        static createFile(body, callback) {
            logger.info(`Started createFile`);
            var content = JSON.stringify(body.split('\n').map(item => item.trim('\r').trim('\n').trim(' ')).filter(item => { return item != null && item.length > 0; }));
            console.log(`content: ${JSON.stringify(content)}`);

            DataFuelDb.saveJsonFile(content, null, callback);
        }

        /**
         * 
         * @param {string} id 
         * @param {function(string):void} callback 
         */
        static getFileByRequestId(id, callback) {
            logger.info(`Started getFileByRequestId: ${id}`);

            pool.query(`select u."Content", r."Name" from "UploadedFiles" u join "Results" r on r."Id" = u."ResultId" where "ResultId" = $1`, [id], (error, result) => {
                if (error) {
                    logger.error(error);
                    console.log(error);
                    callback({ message: 'error occurs during saving the file' });
                    return;
                }

                callback({ result: result.rows[0] });
            });
        }

        /**
         * 
         * @param {string} id 
         * @param {JSON} sheet 
         * @param {function(string):void} callback 
         */
        static updateFileByRequestId(id, sheet, callback) {
            logger.info(`Started getFile: ${id}, ${JSON.stringify(sheet)}`);

            pool.query(`update "UploadedFiles" set "Content" = $2 where "ResultId" = $1`, [id, sheet], (error, result) => {
                if (error) {
                    logger.error(error);
                    console.log(error);
                    callback({ message: 'error occurs during saving the file' });
                    return;
                }

                console.log(JSON.stringify(result));

                if (result.rowCount == 0) {
                    DataFuelDb.saveJsonFile(sheet, id, callback);
                }

                callback({ });
            });
        }

        /**
         * 
         * @param {string} id 
         * @param {function(string):void} callback 
         */
        static getFile(id, callback) {
            logger.info(`Started getFile: ${id}`);

            pool.query(`select "Content" from "UploadedFiles" where "Id" = $1`, [id], (error, result) => {
                if (error) {
                    logger.error(error);
                    console.log(error);
                    callback({ message: 'error occurs during saving the file' });
                    return;
                }

                callback({ result: result.rows });
            });
        }

        /**
         * 
         * @param {JSON} json 
         * @param {function(number):void} callback 
         */
        static saveJsonFile(json, resultId, callback) {
            logger.info(`Started saveJsonFile`);
            pool.query(`insert into "UploadedFiles" ("Content", "ResultId") values($1, $2) RETURNING "Id"`, [json, resultId], (error, result) => {
                if (error) {
                    logger.error(error);
                    console.log(error);
                    callback({ message: 'error occurs during saving the file' });
                    return;
                }

                callback({ result: result.rows[0].Id });
            });

        }

        /**
         * 
         * @param {number} userId 
         * @param {function({message: string, license: {User_Id: number}})} callback
         */
        static getUserCapabilities(userId, callback) {
            logger.info(`Started getUserCapabilities(userId: ${userId})`);
            DataFuelDb.getUserLicense(userId, license => {
                logger.info('Finished getUserCapabilities');

                if (license != null) {
                    logger.info(`Finished getUserCapabilities \n ${JSON.stringify(license)}`);
                    // durty hack for saving the userId into session, since the User_Id of the license is the principal who is owner of the license
                    license.User_Id = userId;
                    callback(license);
                } else {
                    DataFuelDb.getOldUserLicenses({ userId }, licenses => {
                        logger.info(`DataFuelDb.getOldUserLicenses (licenses: ${licenses.length})`);
                        if (licenses.length == 0) {
                            this.setUserLicense(userId, Rates.getGuestRate().Id, callback);
                        } else {
                            callback({ message: 'у вас нет активной лицензии', User_Id: userId });
                        }
                    });
                }
            });
        }

        /**
         * 
         * @param {{userId: number}} context 
         * @param {function({licenses: []}):void} callback 
         */
        static getOldUserLicenses(context, callback) {
            logger.info(`getOldUserLicenses(context: ${JSON.stringify(context)})`);

            pool.query(`SELECT * FROM "UserLicense" WHERE "User_Id" = $1 AND "End_Date" < $2`, [context.userId, new Date()], (error, result) => {
                if (error) {
                    logger.error(`getOldUserLicenses(context: ${JSON.stringify(context)})`);
                    logger.error(error);
                    callback([]);
                    return;
                }

                callback(result.rows);
            })
        }

        static getUserLicense(userId, callback) {
            logger.info(`Started getUserLicense: \r\n userId: ${JSON.stringify(userId)}`);

            DataFuelDb.getUserGroupIds(userId, groups => {
                let items = [];

                if (groups) {
                    groups.forEach(item => items.push(item.Id));
                }

                let ids = [userId].concat(items || []).join(',');
                let query = `SELECT *  FROM "UserLicense" WHERE "User_Id" in (${ids}) AND ("End_Date" > $1 OR "End_Date" IS NULL)  order by "Id" desc`;
                logger.info(`Started query: ${query}`);
                pool.query(query, [new Date()], (error, result) => {
                    if (error) {
                        logger.error('getUserLicense');
                        logger.error(query);
                        logger.error(error);
                        logger.info('Finished getUserLicense');
                        return;
                    }

                    if (result.rowCount > 0) {
                        logger.info(JSON.stringify(result.rows));
                        logger.info('Finished getUserLicense');

                        let actualLicense = getBestLicense(result.rows);

                        //console.log(`groups: ${JSON.stringify(groups)}`);

                        // license owner.
                        let principalId = userId;
                        if (groups) {
                            let group = groups.filter(g => g.Id == actualLicense.User_Id);

                            //console.log(`group: ${JSON.stringify(group)}`);
                            if (group.length == 1) {
                                principalId = group[0].Id;
                            }
                        }

                        DataFuelDb.getPrincipal(principalId, principal => {
                            logger.info('Finished getPrincipal');
                            logger.info(JSON.stringify(principal));
                            logger.info(JSON.stringify(actualLicense));

                            actualLicense.ExportLimit = principal.ExportLimit;
                            actualLicense.TotalRequestLimit = principal.TotalRequestLimit;

                            let rate = Rates.getRate(actualLicense.Rate_Id || 6);
                            actualLicense.Name = rate.Name;
                            callback(actualLicense);
                        })
                    } else {
                        logger.error('getUserLicense');
                        logger.error(`the user with id ${userId} has no license`);
                        callback(null);
                    }
                });
            });
        }

        static setUserLicense(userId, rateId, callback) {
            logger.info(`Started setUserLicense: \r\n userId: ${userId} \r\n rateId: ${rateId}`);

            DataFuelDb.getUser(userId, user => {
                DataFuelDb.selectRate({ user, rateId }, callback);
            });
        }

        static createPrincipal(type, callback) {
            logger.info(`createPrincipal(type: ${type})`);
            pool.query('INSERT INTO "Principal" ("Type") values ($1)', [type], (error, result) => {
                if (error) {
                    logger.error(`createPrincipal(type: ${type})`);
                    logger.error(error);
                    return;
                }

                let tableName = type == 'user' ? 'Users' : 'Groups';
                let query = `SELECT "Id" FROM "Principal" WHERE "Type" = '${type}' AND "Id" NOT IN (SELECT "${tableName}"."Id" FROM "${tableName}")`;
                logger.info(`selectPrincipal: ${query}`);
                pool.query(query, [], (error, result) => {
                    if (error) {
                        logger.error(`select principal(type: ${type})`);
                        logger.info(query);
                        logger.error(error);
                        return;
                    }

                    callback(result.rows[0].Id);
                });
            });

        }

        static createGroup(name, userId, size, callback) {
            logger.info(`createGroup( userId: ${userId}, name: ${name}, size: ${size})`);

            DataFuelDb.createPrincipal('group', principalId => {
                pool.query(`INSERT INTO "Groups" ("Name", "CreatedBy", "Id", "Size") VALUES ($1, $2, $3, $4)`, [name, userId, principalId, size], (error, result) => {
                    if (error) {
                        logger.error(`createGroup( userId: ${userId}, name: ${name})`);
                        logger.error(error);
                        return;
                    }

                    DataFuelDb.addUserToGroup(userId, principalId);
                    callback(principalId);
                });
            });
        }

        static getGroup(id, callback) {
            logger.info('getGroup(id: ${id})');
            pool.query(`select * from "Groups" where "Id" = $1`, [id], (error, result) => {
                if (error) {
                    logger.error('getGroup(id: ${id})');
                    logger.error(error);
                    callback(null);
                    return;
                }

                callback(result.rows);
            })
        }

        static updateGroupExportLimit(principalId, exportLimit, totalRequestLimit, callback) {
            logger.info(`updateGroupExportLimit(principalId: ${principalId}, exportLimit: ${exportLimit}, totalRequestLimit: ${totalRequestLimit})`);
            let updateExportLimitQuery = exportLimit == null ? '$1' : `(CASE WHEN "ExportLimit" IS NULL THEN $1 ELSE  "ExportLimit" + $1 end )`;
            let updateTotalRequestLimitQuery = totalRequestLimit == null ? '$3' : `(CASE WHEN "TotalRequestLimit" IS NULL THEN $3 ELSE  "TotalRequestLimit" + $3 end )`;

            pool.query(`UPDATE "Principal" SET "ExportLimit" = ${updateExportLimitQuery}, 
                "TotalRequestLimit" = ${updateTotalRequestLimitQuery} WHERE "Id" = $2`, [exportLimit, principalId, totalRequestLimit], (error, result) => {
                    if (error) {
                        logger.error(error);
                        logger.error(`updateGroupExportLimit(principalId: ${principalId}, exportLimit: ${exportLimit}, totalRequestLimit: ${totalRequestLimit})`);
                    }
                    callback && callback();
                });
        }

        static reduceTotalRequestLimit(principalId, totalRequestLimit, callback) {
            logger.info(`reduceTotalRequestLimit(principalId: ${principalId}, totalRequestLimit: ${totalRequestLimit})`);
            let updateTotalRequestLimitQuery = `(CASE WHEN "TotalRequestLimit" IS NULL THEN "TotalRequestLimit" ELSE  "TotalRequestLimit" - $1 end )`;

            pool.query(`UPDATE "Principal" SET "TotalRequestLimit" = ${updateTotalRequestLimitQuery} WHERE "Id" = $2`, [totalRequestLimit, principalId], (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.error(`reduceTotalRequestLimit(principalId: ${principalId}, totalRequestLimit: ${totalRequestLimit})`);
                }
                callback && callback();
            });
        }

        static addUserToGroup(userId, groupId, callback) {
            logger.info(`addUserToGroup( userId: ${userId}, groupId: ${groupId})`);

            DataFuelDb.getGroupMembers(groupId, members => {
                //console.log(`members.length: ${members.length}`);
                let addUser = members.length == 0 || members[0].Size > members.length;
                //console.log(addUser);
                logger.info(`insert group member: ${addUser}`);
                if (addUser) {
                    pool.query('INSERT INTO "GroupMembers" ("User_Id", "Group_Id") VALUES ($1, $2)', [userId, groupId], (error, result) => {
                        if (error) {
                            logger.error(`addUserToGroup( userId: ${userId}, groupId: ${groupId})`);
                            logger.error(error);
                            return;
                        }

                        logger.info(`inserted group member: ${JSON.stringify(members)}`);
                    });
                } else {
                    callback({ message: `нельзя добавить пользователя в группу из-за ограничения лицензии` });
                }
            })
        }

        static getUserGroupIds(userId, callback) {
            logger.info(`getUserGroup(userId: ${userId})`);
            pool.query(`SELECT "Groups"."Id", "Principal"."ExportLimit", "Principal"."TotalRequestLimit" FROM "Groups" inner join "GroupMembers" on "Groups"."Id" = "GroupMembers"."Group_Id" inner join "Principal" on "Principal"."Id" = "Groups"."Id" WHERE "GroupMembers"."User_Id" = $1`, [userId], (error, result) => {
                if (error) {
                    logger.error(`getUserGroup(userId: ${userId})`);
                    logger.error(error);
                    callback(null);
                    return;
                }

                callback(result.rows);
            })
        }

        static getGroupMembers(groupId, callback) {
            logger.info(`getGroupMembers (groupId: ${groupId})`);
            pool.query(`SELECT "Users"."Id", "Users"."Name", "Groups"."Size" from "Users" 
                inner join "GroupMembers" on "Users"."Id" = "GroupMembers"."User_Id"
                inner join "Groups" on "Groups"."Id" = "GroupMembers"."Group_Id"
                WHERE "Groups"."Id" = $1`, [groupId], (error, result) => {
                    if (error) {
                        logger.error(`getGroupMembers (groupId: ${groupId})`);
                        logger.error(error);
                        return;
                    }

                    callback(result.rows);
                });
        }

        static addUser(userId, userName, href, callback) {
            logger.info(`addUser( userId: ${userId}, userName: ${userName}, href: ${href})`);
            pool.query(('SELECT "Id" FROM public."Users" where "UserId" = $1'), [userId], (err, result) => {
                logger.info('get user');
                if (err) {
                    logger.error(err);
                }
                //       logger.info(result);

                if (result.rowCount == 0) {
                    DataFuelDb.createPrincipal('user', id => {
                        pool.query('INSERT INTO public."Users" ("UserId", "Email", "Name", "UserProfileUrl", "Id") Values($1, $2, $3, $4, $5)', [userId, "", userName, href, id], (e, r) => {
                            if (e) {
                                logger.error(`INSERT INTO public."Users"`);
                                logger.error(e);
                            }
                            logger.info(`inserted(id: ${id})`);
                            DataFuelDb.getUserCapabilities(id, callback);
                        });
                    });
                } else {
                    DataFuelDb.getUserCapabilities(result.rows[0].Id, callback);
                    //callback(result.rows[0].Id);
                }
            });
        }

        /**
         * Saves the JSON for the specified result
         * @param {number} resultId 
         * @param {JSON} resultJson - body of the result
         * @param {number} idCount - count of the processed user's id
         * @param {function({message: string})} callback 
         */
        static saveResults(resultId, resultJson, idCount, callback) {
            logger.info(`saveResults(resultId: ${resultId}, idCount: ${idCount})`);
            if (typeof (resultJson) == 'object' && resultJson.status == null) {
                resultJson.count = idCount;
                pool.query('UPDATE public."Results" SET "Result" = $1 WHERE "Id" = $2', [resultJson, resultId], (error, result) => {
                    if (error) {
                        logger.error(error);

                        callback && callback({ message: error });
                        return;
                    }
                    logger.info('saveResults: UPDATE');

                    callback && callback();
                });
            } else {
                pool.query('UPDATE public."Results" SET "Broken" = $1 WHERE "Id" = $2', [true, resultId], (error, result) => {
                    if (error) {
                        logger.info(error);
                        callback && callback({ message: error });

                        return;
                    }
                });
            }
        }

        static getMBTI_Types(callback) {
            logger.info(`Starting get mbti types`);

            pool.query('SELECT "Type" FROM "MBTI_Types"', (error, result) => {
                if (error) {
                    logger.error(`get mbti types`);
                    logger.error(error);
                }

                logger.info(`Finished get mbti types`);
                callback(result.rows);
            });
        }

        static createSegment(resultId, type, userIds, age) {
            logger.info(`Starting create segment(resultId: ${resultId}, type: ${type}, userIds.length: ${userIds.length}, age: ${age})`);

            pool.query('INSERT INTO "Segments" ("Result_Id", "Type", "UserIds", "Age") VALUES ($1, $2, $3, $4)', [resultId, type, userIds, age], (error, result) => {
                if (error) {
                    logger.error(`create segment(resultId: ${resultId}, type: ${type}, userIds.length: ${userIds.length}, age: ${age})`);
                    logger.error(error);
                }

                logger.info(`Ended create segment(resultId: ${resultId}, type: ${type}, userIds.length: ${userIds.length}, age: ${age})1`);
            });
        }

        static updateSegment(resultId, type, userIds, age) {
            logger.info(`Starting update segment(resultId: ${resultId}, type: ${type}, userIds.length: ${userIds.length}, age: ${age})`);

            pool.query('UPDATE "Segments" SET "UserIds" = array_cat("UserIds", $1) WHERE "Result_Id" = $2 AND "Type" = $3 AND "Age" = $4', [userIds, resultId, type, age], (error, result) => {
                if (error) {
                    logger.error(`update segment(resultId: ${resultId}, type: ${type}, userIds.length: ${userIds.length}, age: ${age})`);
                    logger.error(error);
                }

                logger.info(`Finished update segment(resultId: ${resultId}, type: ${type}, userIds.length: ${userIds.length}, age: ${age})`);
            });
        }

        static getSegment(id, type, age, callback) {
            logger.info(`Starting getSegment(resultId: ${id}, type: ${JSON.stringify(type)}, age: ${age})`);
            logger.info(`SELECT "Result_Id", "UserIds", "Age", "Type" FROM "Segments" WHERE "Result_Id" = ${id} AND ("Type" = ${JSON.stringify(type)} OR ${JSON.stringify(type)} = '') AND ("Age" = ${age} OR ${age} = '')`);

            let types = type.map(t => `'${t}'`);
            let queryText = `SELECT "Result_Id", "UserIds", "Age", "Type" FROM "Segments" WHERE "Result_Id" = $1 AND ("Type" in (${types.join(',')}) OR $4 in ($2) ) AND ("Age" = $3 OR $3 = $4)`;
            logger.info(queryText);
            pool.query(queryText, [id, type.join(','), age, ''], (error, result) => {
                if (error) {
                    logger.error(`getSegment(resultId: ${id}, type: ${type}, age: ${age})`);
                    logger.error(error)
                }

                logger.info(`Finished getSegment(resultId: ${id}, type: ${type}, age: ${age})`);
                callback(result.rows);
            });
            /* pool.query('SELECT "Result", "Name" FROM public."Results" WHERE "Id" = $1', [id], (error, result) => {
                 if (error) {
                     logger.info(error);
                     callback({ error: 'internal server error ' });
                     return;
                 }
         
                 if (result.rowCount > 0) {
                     callback(result.rows[0].Result, result.rows[0].Name);
                 } else {
                     logger.error(`segment ${id} does not exist`);
                 }
             });*/
        }

        static getSegmentDescription(resultId, resultName, callback) {
            logger.info(`Starting getSegmentDescription(resultId: ${resultId})`);
            pool.query('SELECT array_length("UserIds", 1) as "Count", "Age", "Type" FROM "Segments" WHERE "Result_Id" = $1 AND array_length("UserIds", 1) > 0 order by "Count" desc', [resultId], (error, result) => {
                if (error) {
                    logger.error(`getSegmentDescription(resultId: ${resultId})`);
                    logger.error(error);
                    console.log(error);

                    return;
                }

                console.log(`Finished getSegmentDescription(resultId: ${resultId})`);
                logger.info(`Finished getSegmentDescription(resultId: ${resultId})`);

                callback({ Result: { data: result.rows, name: resultName } });
            });
        }

        static createResult(userId, resultName, resultType, callback) {
            logger.info('createResult');
            logger.info(resultType);

            DataFuelDb.createComponent("result", (id) => {
                pool.query('INSERT INTO public."Results" ("User_Id", "Name", "Type_Id", "Component_Id") Values($1, $2, $3, $4);', [userId, resultName, resultType, id], (err, result) => {
                    logger.info('createResult - inserted');
                    if (err) {
                        logger.error(err);
                        console.log(err);
                        callback(null);
                        return;
                    }
                    logger.info(result);


                    pool.query(`SELECT "Id" FROM public."Results" WHERE "User_Id" = $1 AND "Type_Id" = $2 AND "Name" = $3 ORDER BY "CreatedOn" desc`, [userId, resultType, resultName], (e, r) => {
                        logger.info('createResult: get Id');
                        if (e) {
                            logger.error(e);
                            callback(null);
                            return;
                        }

                        if (r.rowCount > 0) {
                            DataFuelDb.createActivity(userId, `создание запроса: ${resultName}`, (c) => c({ Component_Id: id }));
                            callback(r.rows[0].Id);
                        } else {
                            logger.error('createResult: the new row has not beed added');
                        }
                    });
                });
            });
        }

        static markBrokenResult(resultId) {
            logger.info(`markBrokenResult - resultId: ${resultId}`);
            pool.query('UPDATE public."Results" SET "Broken" = $2 WHERE "Id" = $1', [resultId, true], (err, res) => {
                logger.info(`markBrokenResult - resultId: ${resultId}`);

                DataFuelDb.updateResultProgress(resultId, 100);
                DataFuelDb.updateRequestStatus(resultId, 'suspended');
            });
        }

        static getCurrentResult(userId, resultType, callback) {
            logger.info(`getCurrentResult - ${userId}, resultType: ${resultType}`);

            pool.query('SELECT public."Results"."Id" FROM public."Results" WHERE "User_Id" = $1 AND "Type_Id" = $2 AND "Result" IS NULL AND NOT "Broken"', [userId, resultType], (err, res) => {
                logger.info(`getCurrentResult - ${userId}, resultType: ${resultType}`);
                if (err) {
                    logger.error('getCurrentResult');
                    logger.error(err);
                    return;
                }

                if (res.rowCount > 0) {
                    callback(res.rows[0].Id);
                } else {
                    logger.error('getCurrentResult');
                }
            });
        }

        static getAnalisysStatus(userId, typeId, callback) {
            logger.info(`getAnalisysStatus(${userId}, ${typeId})`);
            pool.query('SELECT "Name", "Progress" from public."Results" WHERE "Result" IS NULL AND "User_Id" = $1 AND NOT "Broken" AND NOT "Deleted" AND "Type_Id" = $2', [userId, typeId], (err, result) => {
                if (err) {
                    logger.info(err);
                    callback([]);
                    return;
                }

                if (result.rowCount == 0) {
                    callback({ Name: null, Progress: 100 });
                } else {
                    callback(result.rows[0]);
                }
            });
        }

        static getResultList(userId, callback) {
            logger.info(`getResultList(${userId})`);

            DataFuelDb.getUserCapabilities(userId, (userInfo) => {
                pool.query('SELECT "User_Id", public."Results"."Id", public."Results"."Name", public."Results"."Broken", public."Results"."CreatedOn", public."ResultType"."Name" as "Type", public."Results"."Result" IS NOT NULL as \"Ready\" FROM public."Results" INNER JOIN public."ResultType" ON public."Results"."Type_Id" = public."ResultType"."Id" WHERE ("User_Id" = $1 OR 8 & $2 = 8) AND NOT public."Results"."Deleted" ORDER BY public."Results"."Id"', [userId, userInfo.Capabilities], (err, result) => {
                    if (err) {
                        logger.info(err);
                        callback([]);
                        return;
                    }

                    logger.info(result.rows);
                    callback(result.rows);
                });
            });
        }

        static getResult(resultId, userId, capabilities, callback) {
            try {
                logger.info(`getResult(resultId: ${resultId}, userId: ${userId}, capabilities: ${capabilities})`);
                //console.log(`getResult(resultId: ${resultId}, userId: ${userId}, capabilities: ${capabilities})`);
                pool.query(`SELECT public."Results"."Result", public."Results"."Name", public."ResultType"."Name" as "Type", public."Results"."Id", public."Results"."Broken", public."Results"."CreatedOn", public."Results"."Component_Id", public."Results"."Progress" 
                            FROM public."Results" 
                            INNER JOIN public."ResultType" ON public."Results"."Type_Id" = public."ResultType"."Id" 
                            WHERE public."Results"."Id" = $1 AND ("Results"."User_Id" = $2 OR ($3 & 1) = 1);`, [resultId, userId, capabilities], (err, result) => {
                        if (err) {
                            logger.error(err);
                            console.log(err);
                            callback([]);
                            return;
                        }
                        //console.log(`result ${JSON.stringify(result)}`);

                        if (result.rowCount > 0) {
                            console.log(result.rows[0].Type.toLowerCase());
                            switch (result.rows[0].Type.toLowerCase()) {
                                case 'analisys':
                                case 'look_a_like':
                                    let data = result.rows[0];
                                    DataFuelDb.getSegmentDescription(resultId, result.rows[0].Name, segment => {
                                        data.segments = segment
                                        callback(data);
                                    });
                                    break;
                                case 'segment':
                                    DataFuelDb.getSegmentDescription(resultId, result.rows[0].Name, callback);
                                    break;
                                case 'usersbyphones': 
                                    callback(result.rows[0]);
                                    break;

                            }
                        } else {
                            logger.error(`result ${resultId} does not exist`);
                            console.log(`result ${resultId} does not exist`);
                        }
                    });
            }
            catch (err) {
                logger.error(`getResult`);
                console.log(err);
                logger.error(err);
            }
        }

        static isNotificationRequired(resultId, callback) {
            logger.info(`isNotificationRequired(resultId: ${resultId}`);

            pool.query('SELECT public."ResultNotifications"."Sent" FROM public."ResultNotifications" WHERE public."ResultNotifications"."Result_Id" = $1', [resultId], (error, result) => {
                if (error) {
                    logger.error(error);
                    callback(null);
                    return;
                }

                if (result.rowCount > 0) {
                    callback(result.rows[0].Sent);
                } else {
                    callback(null);
                    logger.info(`result ${resultId} does not exist`);
                }
            });
        }

        static createOrUpdateResultNotifications(resultId, sent, callback) {
            logger.info(`updateResultNotifications(resultId: ${resultId}, sent: ${sent}`);

            pool.query('SELECT * FROM public."ResultNotifications" WHERE public."ResultNotifications"."Result_Id" = $1', [resultId], (error, result) => {
                if (error) {
                    logger.error(error);
                    return;
                }

                if (result.rowCount > 0) {
                    pool.query('UPDATE public."ResultNotifications" SET "Sent" = $1 WHERE "Result_Id" = $2', [sent, resultId], (err, res) => {
                        if (err) {
                            logger.error(err);
                            return;
                        }

                        logger.info(`Finished: notification updated (resultId: ${resultId}, sent: ${sent}`);
                    });
                } else {
                    pool.query('INSERT INTO public."ResultNotifications" ("Result_Id", "Sent") VALUES ($1, $2)', [resultId, sent], (err, res) => {
                        if (err) {
                            logger.error(err);
                            return;
                        }

                        logger.info(`Finished: new notification inserted (resultId: ${resultId}, sent: ${sent}`);
                    });
                }
            });
        }

        static getAllRates(billableOnly, callback) {
            logger.info('Starting: getAllRates');

            pool.query('SELECT * FROM public."Rates"', (error, result) => {
                if (error) {
                    logger.error(error);
                    callback(null);
                    return;
                }

                callback(result.rows);
            });
        }

        static getAvailableRates(billableOnly, callback) {
            logger.info('Starting: getAvailavbleRates');

            pool.query('SELECT * FROM public."Rates" WHERE "Request" > 0 AND cast("Cost" as DECIMAL) > 0 OR NOT $1', [billableOnly], (error, result) => {
                if (error) {
                    logger.error(error);
                    callback(null);
                    return;
                }

                callback(result.rows);
            });
        }

        /**
         * 
         * @param {{user: User, rateId: number, force: boolean}} context 
         * @param {function({message: string})} callback 
         */
        static selectRate(context, callback) {
            let user = context.user,
                rateId = context.rateId;

            logger.info(`Starting: selectRate [user = ${JSON.stringify(user)}, rateId = ${rateId}]`);
            let userId = user.Id;

            if (context.force) {
                AssignLicense(userId, Rates.getRate(rateId), false, true);
                return;
            }

            DataFuelDb.getUserLicense(userId, userRate => {
                //console.log(`userRate.Cost: ${JSON.stringify(userRate)}`);
                logger.info(`current license of user ${JSON.stringify(userRate)}`);
                if (userRate && userRate.Rate_Id != null && Rates.getRate(userRate.Rate_Id).Cost != '0.00') {
                    console.log(`у вас есть активный тариф, обратитесь в поддержку для смены`);
                    callback({ User_Id: user.Id, Capabilities: userRate.Permissions, message: 'у вас есть активный тариф, обратитесь в поддержку для смены' });
                    return;
                }

                DataFuelDb.getRate(rateId, user.Money, (rate) => {
                    //console.log(`rate.Cost: ${JSON.stringify(rate)}`);
                    if (rate == null) {
                        callback({ User_Id: user.Id, message: 'пополните счет' });
                        return;
                    }

                    if (rate.GroupSize != 1) {
                        DataFuelDb.createGroup(rate.Name, userId, rate.GroupSize, principalId => AssignLicense(principalId, rate, true));
                        return;
                    }

                    //console.log(`user.Money: ${user.Money}`);
                    // console.log(`rate.Cost: ${rate.Cost}`);
                    AssignLicense(userId, rate, false);
                });
            });

            function AssignLicense(principalId, rate, isGroup, force = false) {
                logger.info(`AssignLicense(principalId: ${principalId}, rate: ${JSON.stringify(rate)})`);

                DataFuelDb.getCountOfBillableUsers(count => {
                    // do not reduce money if the license is provided by admin.
                    let cost = force ? 0 : rate.Cost;
                    if (count < 50 && !force) {
                        rate = Rates.getNextRate(rate);
                        logger.info(`improve license (principalId: ${principalId}, rate: ${JSON.stringify(rate)})`);
                    }

                    let date = new Date();
                    logger.info(`assign license(principalId: ${principalId}, rate: ${JSON.stringify(rate)}, isGroup: ${isGroup})`);
                    pool.query('INSERT INTO "UserLicense" ("Rate_Id", "Capabilities", "End_Date", "Requests", "User_Id", "GroupSize") values ($1, $3, $4, $5, $2, $6)',
                        [rateId, principalId, rate.Permissions, new Date(date.setTime(date.getTime() + rate.Limitation * 86400000)), rate.Request, rate.GroupSize], (error, result) => {
                            logger.info(`Finished: selectRate [principalId = ${principalId}, rateId = ${rateId}]`);
                            if (error) {
                                logger.error(error);
                                return;
                            }

                            DataFuelDb.reduceMoney(user.Id, cost, (money) => {
                                user.Money = money;
                                //console.log(`rest money: ${money}`);
                                //console.log(`isGroup: ${isGroup}`);
                                DataFuelDb.updateGroupExportLimit(principalId, rate.ExportLimit, rate.TotalRequestLimit, () => {
                                    DataFuelDb.getPrincipal(principalId, principal => {
                                        callback({
                                            User_Id: user.Id,
                                            Capabilities: rate.Permissions,
                                            message: 'тариф успешно выбран',
                                            ExportLimit: principal.ExportLimit,
                                            Money: user.Money,
                                            Requests: rate.Request,
                                            TotalRequestLimit: principal.TotalRequestLimit,
                                            success: true
                                        });
                                    })
                                });
                            });
                            DataFuelDb.createActivity(userId, `выбор тарифа: ${rate.Name}`);
                        });
                });
            }

            function convertToFloat(money) {
                var num = money.toString().substr(1, money.toString().length - 1);
                return parseFloat(num);
            }
        }

        static getPrincipal(id, callback) {
            logger.info(`get princiapl id: ${id}`);
            pool.query(`SELECT * FROM "Principal" where "Id" = $1`, [id], (error, result) => {
                if (error) {
                    logger.error(`get princiapl id: ${id}`);
                    logger.error(error);
                    callback(null);
                    return;
                }

                if (result.rowCount == 0) {
                    callback(null);
                    logger.error(`there is no principal with id ${id}`);
                    return;
                }

                callback(result.rows[0]);
            });
        }

        static getUser(userId, callback) {
            logger.info(`Starting: getUser(userId: ${userId})`);

            pool.query('SELECT * FROM "Users" WHERE "Id" = $1', [userId], (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.info(`Finished: getUser(userId: ${userId})`);
                    return;
                }

                if (result.rowCount > 0) {
                    logger.info(result.rows);
                    logger.info(`Finished: getUser(userId: ${userId})`);
                    callback(result.rows[0]);
                } else {
                    logger.error(`these is no user with id: ${userId})`);
                }
            });
        }

        /**
         * 
         * @param {{primaryUserId: number, secondaryUserId: number}} context 
         * @param {function():boolean} callback 
         */
        static createPromoRelationship(context, callback) {
            logger.info(`Starting: createPromoRelationship(user: ${JSON.stringify(context)})`);

            pool.query(`INSERT INTO "PromoRelationships" ("PrimaryUser_Id", "SecondaryUser_Id") VALUES ($1, $2)`, [context.primaryUserId, context.secondaryUserId], error => {
                if (error) {
                    logger.error(`createPromoRelationship(user: ${JSON.stringify(context)})`);
                    logger.error(error);
                    callback(false);
                    return;
                }

                callback(true);
            });
        }

        /**
         * 
         * @param {{primaryUserId: number, secondaryUserId: number}} context 
         * @param {function():User} callback 
         */
        static getPromoRelationships(context, callback) {
            logger.info(`Starting: getPromoRelationships(user: ${JSON.stringify(context)})`);
            let query = `SELECT * FROM "Users" WHERE `;

            if (context.primaryUserId) {
                query += `"Users"."Id" in (SELECT "PromoRelationships"."SecondaryUser_Id" FROM "PromoRelationships" WHERE "PromoRelationships"."PrimaryUser_Id" = ${context.primaryUserId})`;
            }

            if (context.secondaryUserId) {
                query += `OR "Users"."Id" in (SELECT "PromoRelationships"."SecondaryUser_Id" FROM "PromoRelationships" WHERE "PromoRelationships"."SecondaryUser_Id" = ${context.secondaryUserId})`;
            }

            logger.info(`getPromoRelationships(user: ${JSON.stringify(context)}, query: ${query})`);
            pool.query(query, (error, result) => {
                if (error) {
                    logger.error(error);
                    callback(null);
                    return;
                }

                callback(result.rows);
            });
        }

        static updateUser(user) {
            logger.info(`Starting: updateUser(user: ${JSON.stringify(user)})`);
            logger.info(user);

            pool.query('UPDATE public."Users" SET "UserId"=$1, "Email"=$2, "Name"=$3, "UserProfileUrl"=$4, "Money"=$5, "Promo"=$7, "IP"=$8::text WHERE "Id" = $6;',
                [user.UserId, user.Email, user.Name, user.UserProfileUrl, user.Money, user.Id, user.Promo, user.IP], (error) => {
                    logger.info(`Finished: updateUser(userId: ${user.Id})`);
                    if (error) {
                        logger.error(error);
                        return;
                    }

                    DataFuelDb.createActivity(user.Id, `обновление профиля пользователя`);
                });
        }

        static getRate(rateId, money, callback) {
            logger.info(`Starting: getRate(rateId: ${rateId}, money: ${money})`);

            pool.query('SELECT * FROM "Rates" WHERE "Id" = $1 AND "Cost" <= $2', [rateId, money], (error, result) => {
                logger.info(`Finished: getRate(rateId: ${rateId})`);
                if (error) {
                    logger.error(error);
                    return;
                }

                if (result.rowCount > 0) {
                    callback(result.rows[0]);
                } else {
                    logger.error(`these is no rate with id: ${rateId})`);
                    callback(null);
                }
            });
        }

        static buyRequests(userId, count, callback) {
            throw new NotImplementedException();
            logger.info(`Starting: buyRequests(userId: ${userId}, count: ${count})`);

            DataFuelDb.getUserLicense(userId, (license) => {
                DataFuelDb.getUser(userId, (user) => {
                    logger.info(user);

                    if (license.Rate_Id == null) {
                        if (count <= 0) {
                            callback(null);
                            return;
                        }

                        callback(`реквестов не достаточно для анализа выбранной аудитории`);
                        logger.error('реквестов не достаточно для анализа выбранной аудитории');
                        return;
                    }

                    DataFuelDb.getRate(license.Rate_Id, (rate) => {
                        const licenseCount = Math.round(count / rate.Request) + (count % rate.Request > 0 ? 1 : 0);
                        const bill = rate.Cost * licenseCount;

                        logger.info(`count: ${count}`);
                        logger.info(`rate.Request: ${rate.Request}`);
                        logger.info(`licenseCount: ${licenseCount}`);
                        logger.info(`bill: ${bill}`);
                        logger.info(`rate.Cost : ${rate.Cost}`);

                        if (user.Money < bill) {
                            logger.info(`Finished: buyRequests(userId: ${userId}) - balance error: user.Money:${user.Money}, bill: ${bill}, rate.Id: ${rate.Id}`);
                            callback(`у вас не достаточен баланс для проведения этой операции, пожалуйста пополните баланс на ${bill - user.Money}`);
                            return;
                        }

                        pool.query('UPDATE "Users" SET "Money" = "Money" - $1 WHERE "Id" = $2', [bill, userId], (error, result) => {
                            if (error) {
                                callback('произошла ошибка при списании средств со счета');
                                logger.error(error);
                                return;
                            }

                            pool.query('UPDATE "UserLicense" SET "Requests"=$1 WHERE "User_Id" = $2', [licenseCount * rate.Request - count, userId], (error, result) => {
                                if (error) {
                                    callback('произошла ошибка при добавлении реквестов');
                                    logger.error(error);
                                    return;
                                }

                                DataFuelDb.createActivity(userId, `авто покупка реквестов ${count}`);
                                callback(null);
                            });
                        });
                    });
                });
            });
        }

        /**
         * 
         * @param {context} {
         * id: int - internal id of the user
         * userId: string - VK id of the user
         * count: int - the count of the requests for adding
         * } 
         * @param {callback} is function for returning object with message
         */
        static addRequests(context, callback) {
            logger.info(`Starting: addRequests(context: ${JSON.stringify(context)})`);

            let conditionQuery = `"Id" = ${context.Id}`;

            if (context.UserId) {
                conditionQuery = `"Principal"."Id" = (select "Users"."Id" from "Users" inner join "Principal" on "Principal"."Id" = "Users"."Id" where "Users"."UserId" = ${context.UserId})`;
            }

            pool.query(`UPDATE "Principal" SET "TotalRequestLimit" = (CASE WHEN "TotalRequestLimit" IS NULL THEN $1 ELSE  "TotalRequestLimit" + $1 end) WHERE ${conditionQuery}`, [context.Count], (error, result) => {
                if (error) {
                    callback({ message: `произошла ошибка при возврате реквестов, обратитесь в службу поддержки для возврата ${context.Count} реквестов` });
                    logger.error(`произошла ошибка при возврате реквестов, обратитесь в службу поддержки для возврата (context: ${JSON.stringify(context)}) реквестов`);
                    logger.error(error);
                    return;
                }

                callback({ message: 'реквесты упешно добавленны' });
            });
        }

        /**
         * Obsolete, please use the {addRequests} function
         */
        static restoreRequests(userId, count, callback, successCallback) {
            logger.info(`Starting: restoreRequests(userId: ${userId}, count: ${count})`);

            pool.query('UPDATE "Principal" SET "TotalRequestLimit" = "TotalRequestLimit" + $1 WHERE "Id" = $2', [count, userId], (error, result) => {
                if (error) {
                    callback(`произошла ошибка при возврате реквестов, обратитесь в службу поддержки для возврата ${count} реквестов`);
                    logger.error(`произошла ошибка при возврате реквестов, обратитесь в службу поддержки для возврата ${count} реквестов`);
                    logger.error(error);
                    return;
                }

                successCallback('реквесты упешно добавленны');
            });
        }

        static addMoney(userId, money, callback) {
            logger.info(`Starting: addMoney(userId: ${userId}, money: ${money})`);

            pool.query('UPDATE "Users" SET "Money" = "Money" + $1 WHERE "Id" = $2', [money, userId], (error, result) => {
                if (error) {
                    logger.error(error);
                    return;
                }

                DataFuelDb.getUser(userId, (user) => {
                    callback(user.Money);
                });

                logger.info(JSON.stringify(result));
                logger.info(`Finished: addMoney(userId: ${userId}, money: ${money})`);

                DataFuelDb.createActivity(userId, `пополнение счета на ${money}`);
            });
        }

        static reduceMoney(userId, money, callback) {
            logger.info(`Starting: reduceMoney(userId: ${userId}, money: ${money})`);

            pool.query('UPDATE "Users" SET "Money" = "Money" - $1 WHERE "Id" = $2', [money, userId], (error, result) => {
                if (error) {
                    logger.error(error);
                    return;
                }

                DataFuelDb.getUser(userId, (user) => {
                    callback(user.Money);
                });

                logger.info(JSON.stringify(result));
                logger.info(`Finished: reduceMoney(userId: ${userId}, money: ${money})`);

                DataFuelDb.createActivity(userId, `уменьшение счета на ${money}`);
            });
        }

        /**
         * Updates the lisence of the current user to the PROMO
         * @param {number} userId 
         * @param {function(boolean):void} callback
         */
        static setPromoLicense(userId, callback) {
            logger.info(`Starting: setPromoLicense(userId: ${userId})`);
            let rate = Rates.getPromoRate();
            logger.info(`getPromoRate: ${JSON.stringify(rate)}`);
            let date = new Date();

            pool.query('INSERT INTO "UserLicense" ("Capabilities", "Requests", "Rate_Id", "User_Id", "End_Date", "GroupSize") values ($1, $2, $3, $4, $5, $6)',
                [rate.Permissions, rate.Request, rate.Id, userId, new Date(date.setTime(date.getTime() + rate.Limitation * 86400000)), 1], (error, result) => {
                    logger.info(`Finished: setPromoLicense(userId: ${userId})`);
                    logger.info(rate);

                    if (error) {
                        logger.error(error);
                        callback(null, false);
                        return;
                    }

                    let updateTotalRequestLimitQuery = `(CASE WHEN "TotalRequestLimit" IS NULL THEN "TotalRequestLimit" ELSE  "TotalRequestLimit" + $1 end )`;
                    let updateExportLimitQuery = `(CASE WHEN "ExportLimit" IS NULL THEN $2 ELSE  "ExportLimit" + $2 end )`;

                    pool.query(`UPDATE "Principal" set "TotalRequestLimit" = ${updateTotalRequestLimitQuery}, "ExportLimit" = ${updateExportLimitQuery} WHERE "Id" = $3`, [rate.TotalRequestLimit, rate.ExportLimit, userId], error => {
                        if (error) {
                            logger.error(`setPromoLicense - updating principal(license: ${JSON.stringify(rate)})`);
                            logger.error(error);
                            callback(null, false);
                            return;
                        }

                        logger.info(`Finished: setPromoLicense - updating principal(userId: ${JSON.stringify(rate)})`);
                        callback(rate, true);
                    });
                });
        }

        static updateResultName(resultId, name, userId) {
            logger.info(`Starting updateResultName(resultId: ${resultId}, name: ${name})`);

            pool.query('UPDATE "Results" SET "Name" = $1 WHERE "Id" = $2', [name, resultId], (error, result) => {
                if (error) {
                    logger.error(`UpdateResultName(resultId: ${resultId}, name: ${name}) has been finished with error`);
                    logger.error(error);
                    return;
                }

                logger.info(`UpdateResultName(resultId: ${resultId}, name: ${name}) has been successfully finished`);
            //    DataFuelDb.createActivity(userId, `имя результата изменено на: ${name}`, (callback) => DataFuelDb.getResult(resultId, userId, 0, callback));
            });
        }

        static createActivity(userId = 10000, description, getComponentId = null) {
            userId = userId > 0 ? userId : 10000;
            logger.info(`Started CreateActivity(userId: ${userId}, description: ${description})`);

            if (getComponentId != null) {
                getComponentId((component) => {
                    addActivity(component.Component_Id);
                });
            } else {
                addActivity(null);
            }

            function addActivity(componentId) {
                pool.query('INSERT INTO "Activities" ("User_Id", "Description", "RootComponent_Id") Values ($1, $2, $3)', [userId, description, componentId], (error, result) => {
                    if (error) {
                        logger.error(`CreateActivity(userId: ${userId}, description: ${description}) has been finished with error`);
                        logger.error(error);
                        return;
                    }

                    logger.info(`CreateActivity(userId: ${userId}, description: ${description}) has been successfully finished`);
                });
            }
        }

        static getActivities(userId, callback) {
            logger.info(`Get activities is started with following params: userId: ${userId}`);

            pool.query('SELECT * FROM "Activities" WHERE "User_Id" = $1 ORDER BY "CreatedOn" desc', [userId], (error, result) => {
                if (error) {
                    logger.error(`GetActivities(userId: ${userId}) has been finished with error`);
                    logger.error(error);
                    return;
                }

                callback(result.rows);
            });
        }

        static CreateArticle(userId, title, description) {
            logger.info(`Starting the CreateArticle(userId: ${userId}, title: ${title}, description: ${description})`);

            DataFuelDb.createComponent("article", (id) => {
                pool.query('INSERT INTO "Knowledges" ("Title", "Description", "CreatedBy", "ModifiedBy", "Component_Id") VALUES ($1, $2, $3, $3, $4)', [title, description, userId, id], (error, result) => {
                    if (error) {
                        logger.error(`CreateArticle(userId: ${userId}, title: ${title}, description: ${description}) finished with error`);
                        logger.error(error);
                        return;
                    }

                    logger.info(`Finishing the CreateArticle(userId: ${userId}, title: ${title}, description: ${description})`);
                    DataFuelDb.createActivity(userId, `добавленна статья: ${title} \r\n ${description}`, (c) => c({ Component_Id: id }));
                });
            });
        }

        static getArticles(callback) {
            logger.info(`Starting getArticles`);

            pool.query('SELECT * FROM "Knowledges" WHERE NOT "Deleted"', (error, result) => {
                if (error) {
                    logger.error(`getArticles is finished with error`);
                    logger.error(error);
                }

                logger.info(`Finishing getArticles`);
                callback(result.rows);
            });
        }

        static getArticle(id, callback) {
            logger.info(`Starting getArticle(id: ${id})`);

            pool.query('SELECT * FROM "Knowledges" WHERE "Id" = $1', [id], (error, result) => {
                if (error) {
                    logger.error(`getArticle(id: ${id}) is finished with error`);
                    logger.error(error);
                }

                logger.info(`Finishing getArticle(id: ${id})`);
                callback(result.rows[0]);
            });
        }

        static updateArticle(article, userId) {
            logger.info(`Starting updateArticle(article: ${JSON.stringify(article)}, userId: ${userId})`);

            pool.query('UPDATE "Knowledges" SET "Title" = $1, "Description" = $2, "ModifiedBy" = $3, "ModifiedOn" = now() WHERE "Id" = $4', [article.Title, article.Description, userId, article.Id], (error, result) => {
                if (error) {
                    logger.error(`updateArticle(article: ${JSON.stringify(article)}, userId: ${userId})`);
                    logger.error(error);
                }

                logger.info(`Finishing updateArticle(article: ${JSON.stringify(article)}, userId: ${userId})`);
                DataFuelDb.createActivity(userId, `статья обновлена: ${article.title} \r\n ${article.description}`, (c) => DataFuelDb.getArticle(article.Id, c));
            });
        }

        static deleteArticle(articleId, userId) {
            logger.info(`Starting deleteArticle(articleId: ${articleId}, userId: ${userId})`);

            pool.query('UPDATE "Knowledges" SET "Deleted" = true WHERE "Id" = $1', [articleId], (error, result) => {
                if (error) {
                    logger.error(`deleteArticle(articleId: ${articleId}, userId: ${userId})`);
                    logger.error(error);
                }

                logger.info(`Finishing updateArticle(articleId: ${articleId}, userId: ${userId})`);
                DataFuelDb.createActivity(userId, `статья удалена`, (c) => DataFuelDb.getArticle(articleId, c));
            });
        }

        static createComponent(type, callback) {
            logger.info(`Starting to create component with type ${type}`);

            pool.query('INSERT INTO "Components" ("Type") VALUES ($1)', [type], (error, result) => {
                if (error) {
                    logger.error(`create component(type: ${type}) finished with error`);
                    logger.error(error);
                    return;
                }

                pool.query('SELECT "Id" FROM "Components" ORDER BY "Id" DESC', (err, res) => {
                    if (err) {
                        logger.error(`create component(type: ${type}) finished with error`);
                        logger.error(err);
                        return;
                    }

                    callback(res.rows[0].Id);
                });
            });
        }

        static CreateBlog(userId, title, description) {
            logger.info(`Starting the CreateBlog(userId: ${userId}, title: ${title}, description: ${description})`);

            DataFuelDb.createComponent("Blog", (id) => {
                pool.query('INSERT INTO "Blog" ("Title", "Description", "CreatedBy", "ModifiedBy", "Component_Id") VALUES ($1, $2, $3, $3, $4)', [title, description, userId, id], (error, result) => {
                    if (error) {
                        logger.error(`CreateBlog(userId: ${userId}, title: ${title}, description: ${description}) finished with error`);
                        logger.error(error);
                        return;
                    }

                    logger.info(`Finishing the CreateBlog(userId: ${userId}, title: ${title}, description: ${description})`);
                    DataFuelDb.createActivity(userId, `добавленна статья: ${title} \r\n ${description}`, (c) => c({ Component_Id: id }));
                });
            });
        }

        static getBlog(callback) {
            logger.info(`Starting getBlogs`);

            pool.query('SELECT * FROM "Blog" WHERE NOT "Deleted"', (error, result) => {
                if (error) {
                    logger.error(`getBlogs is finished with error`);
                    logger.error(error);
                }

                logger.info(`Finishing getBlogs`);
                callback(result.rows);
            });
        }

        static getBlog(id, callback) {
            logger.info(`Starting getBlog(id: ${id})`);

            pool.query('SELECT * FROM "Blog" WHERE "Id" = $1', [id], (error, result) => {
                if (error) {
                    logger.error(`getBlog(id: ${id}) is finished with error`);
                    logger.error(error);
                }

                logger.info(`Finishing getBlog(id: ${id})`);
                callback(result.rows[0]);
            });
        }

        static updateBlog(blog, userId) {
            logger.info(`Starting updateBlog(Blog: ${JSON.stringify(blog)}, userId: ${userId})`);

            pool.query('UPDATE "Blog" SET "Title" = $1, "Description" = $2, "ModifiedBy" = $3, "ModifiedOn" = now() WHERE "Id" = $4', [blog.Title, blog.Description, userId, blog.Id], (error, result) => {
                if (error) {
                    logger.error(`updateBlog(Blog: ${JSON.stringify(blog)}, userId: ${userId})`);
                    logger.error(error);
                }

                logger.info(`Finishing updateBlog(Blog: ${JSON.stringify(blog)}, userId: ${userId})`);
                DataFuelDb.createActivity(userId, `статья обновлена: ${blog.title} \r\n ${blog.description}`, (c) => DataFuelDb.getBlog(blog.Id, c));
            });
        }

        static deleteBlog(blogId, userId) {
            logger.info(`Starting deleteBlog(BlogId: ${blogId}, userId: ${userId})`);

            pool.query('UPDATE "Blog" SET "Deleted" = true WHERE "Id" = $1', [blogId], (error, result) => {
                if (error) {
                    logger.error(`deleteBlog(BlogId: ${blogId}, userId: ${userId})`);
                    logger.error(error);
                }

                logger.info(`Finishing updateBlog(BlogId: ${blogId}, userId: ${userId})`);
                DataFuelDb.createActivity(userId, `статья удалена`, (c) => DataFuelDb.getBlog(blogId, c));
            });
        }

        static addUsersForProcessing(resultId, userIds, callback) {
            logger.info(`Starting addUsersForProcessing(resultId: ${resultId}, userId.length: ${userIds.length})`);

            pool.query('INSERT INTO "UserForProcessing" ("Result_Id", "UserIds") VALUES ($1, $2)', [resultId, userIds], (error, result) => {
                if (error) {
                    logger.error(`addUsersForProcessing(resultId: ${resultId}, userId.length: ${userIds.length})`);
                    logger.error(error);
                }

                callback();
            });

            logger.info(`Finishing addUsersForProcessing(resultId: ${resultId}, userId.length: ${userIds.length})`);
        }

        static clearUserForProcessing(callback) {
            logger.info(`starting the clearUsersForProcessing`);
            pool.query('DELETE FROM "UserForProcessing"', (error, result) => {
                if (error) {
                    logger.error(`the clearUsersForProcessing`);
                    logger.error(error);
                }
                callback();
            })
        }

        static getUsersForProcessing(resultId, callback) {
            logger.info(`Starting getUsersForProcessing(resultId: ${resultId})`);

            pool.query('SELECT * FROM "UserForProcessing" WHERE "Result_Id" = $1 ORDER BY "Id" LIMIT 1', [resultId], (error, result) => {
                if (error || result == null) {
                    logger.error(`getUsersForProcessing(resultId: ${resultId})`);
                    logger.error(error);
                    callback(null);
                    return;
                }

                logger.info(`Finishing getUsersForProcessing(resultId: ${resultId}) \n result.rows.length: ${result.rows.length}`);

                if (result.rows.length > 0) {
                    pool.query('DELETE FROM "UserForProcessing" WHERE "Id" = $1', [result.rows[0].Id], (err, res) => {
                        if (error) {
                            logger.error(`getUsersForProcessing(resultId: ${resultId}) \n DELETE FROM "UserForProcessing" WHERE "Id" = ${result.rows[0].Id}`);
                            logger.error(error);
                        }

                        logger.info(`callback(result.rows[0].UserIds: ${result.rows[0].UserIds.length})`);
                        callback(result.rows[0].UserIds);
                    });
                } else {
                    callback(null);
                }
            });
        }

        static getCountOfBillableUsers(callback) {
            logger.info(`getCountOfBillableUsers`);

            pool.query(`SELECT "Id" from "UserLicense" WHERE "Rate_Id" in (SELECT "Id" FROM "Rates" where "Cost" > '0.0')`, (error, result) => {
                if (error) {
                    logger.error(`get count of billable users`);
                    logger.error(error);
                    return;
                }

                logger.info('end get count of billable users');
                callback(result.rowCount);
            });
        }

        static updateUserAdvertisementId(userId, accountId) {
            logger.info(`Starting updateUserAdvertisementId(userId: ${userId}, accountId: ${accountId})`);

            pool.query('UPDATE "Users" SET "AccountId" = $1 WHERE "Id" = $2', [accountId, userId], (error, result) => {
                if (error) {
                    logger.error(`getUsersForProcessing(resultId: ${resultId})`);
                    logger.error(error);
                }

                logger.info(`finished updateUserAdvertisementId(userId: ${userId}, accountId: ${accountId})`)
            });
        }

        static saveExportFile(resultId, file, callback) {
            logger.info(`Starting saveExportFile(resultId: ${resultId})`);

            pool.query('SELECT * FROM "ResultExportFiles" WHERE "Result_Id" = $1', [resultId], (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.error(`Finished saveExportFile(resultId: ${resultId})`);
                    return;
                }

                if (result.rows.length > 0) {
                    callback();
                    return;
                }

                pool.query('INSERT INTO "ResultExportFiles" ("Result_Id", "Content") values ($1, $2)', [resultId, JSON.stringify(file)], (error, result) => {
                    if (error) {
                        logger.error(error);
                        logger.error(`Finished saveExportFile(resultId: ${resultId})`);
                        return;
                    }

                    callback();
                    logger.info(`Finished saveExportFile(resultId: ${resultId})`);
                });
            });
        }

        static getExportFile(resultId, callback) {
            logger.info(`Starting getExportFile(resultId: ${resultId})`);

            pool.query('SELECT "Content", "Name" from "ResultExportFiles" inner join "Results" on "Results"."Id" = "Result_Id" where "Result_Id" = $1', [resultId], (error, result) => {
                if (error) {
                    logger.error(error);
                    logger.error(`finished getExportFile(resultId: ${resultId})`);
                    return;
                }

                logger.info(`finished getExportFile(resultId: ${resultId})`);
                if (result.rows.length > 0) {
                    callback(result.rows[0]);
                } else {
                    callback(null);
                }
            });
        }

        static getSpecialPromoRate(name) {
            return SpecialPromos.getRateByPromo(name);
        }

        static getSpecialPromo(name) {
            return SpecialPromos.getPromo(name);
        }
    }

    function getBestLicense(licences) {
        if (licences.length == 1) {
            return licences[0];
        }

        const guest = licences.filter(l => l.Rate_Id == Rates.getGuestRate().Id)[0];
        const promo = licences.filter(l => l.Rate_Id == Rates.getPromoRate().Id)[0];
        const best = licences.filter(l => l.Rate_Id != Rates.getPromoRate().Id && l.Rate_Id != Rates.getGuestRate().Id)[0];

        return best || promo || guest;
    }

    var Rates = require('../model/rates.js')(DataFuelDb);
    var SpecialPromos = require('../model/specialPromos.js')(DataFuelDb);

    module.exports = DataFuelDb;
})(module.exports, require, module);