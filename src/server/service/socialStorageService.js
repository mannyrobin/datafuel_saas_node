'use strict';
var request = require('request');
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: './logs/social-store-data-fuel.log',
            maxsize: 1024 * 1024 * 10,
            maxFiles: 10,
            json: false,
            eol: '\r\n'
        })
    ]
});


(function (exports, require, module) {
    let dataBaseService;
    const API_URL = 'https://api.datafuel.ru/';
    const LookALike_API_URL = 'http://api.datafuel.ru:1488';
    const header = 'Basic cHN5ZXh0ZW50aW9uOnNoaWthcmk2NjY=';
    const credentials = {
        user: 'psyextention',
        pass: 'shikari666'
    };

    class SocialStorageService {
        static initialize(service) {
            dataBaseService = service;
        }

        /**
         * params = {
         * sourceUserIds: int[],
         * targetUserIds: int[],
         * resultId: int,
         * sex: [0,1,2],
         * distance: int,
         * count: int
         * }
         */
        static getLookALike(params, callback) {
            let resultId = params.resultId;
            let count = 0;
            logger.info(`getLookALike(${JSON.stringify(params)})`);
            // console.log(`getLookALike(${resultId}, count: ${params.count})`);
            request.post({ url: `${API_URL}/lal`,
                headers: {authorization: header},  
                body: { 
                    source_ids: params.sourceUserIds, 
                    target_ids: params.targetUserIds, 
                    count: params.count 
                    }, json: true, timeout: 86400000 }, function (err, httpResponse, body) {
                if (err) {
                    logger.error('getLookALike failed:', err);

                    callback(null);
                    return;
                }

                let jsonResponse = JSON.stringify(body);
                logger.info(`getLookALike successful ${count++}! getLookALike(resultId: ${resultId})`);
               // console.info(`Upload successful ${jsonResponse}! getLookALike(resultId: ${resultId})`);
                // console.log(`Upload successful ${count++}! getLookALike(resultId: ${jsonResponse})`);

                /*  body = {
                      ids: [{'1': 1.0}, {'2781070': 0.9634}]
                  }*/
                if (jsonResponse.toLowerCase().indexOf('error') > 0 || jsonResponse.toLowerCase().indexOf('body') > 0 || body.length === undefined) {
                    logger.error(` getLookALike(result: ${jsonResponse})`);
                    console.log(`error getLookALike(resultId: ${resultId}! getStats Server responded with:`, body);
                    callback(null);
                    return;
                }

                let ids = []
                try {
                    body.forEach(item => {
                        ids.push(item.id);
                    });
                } catch(e){
                    logger.error(`error getLookALike(result: ${jsonResponse}, ${e})`);
                    console.log(`error getLookALike(resultId: ${resultId}! getStats Server responded with (result: ${jsonResponse}, ${e}):`);
                    callback(null);
                    return;
                }

                // console.log(`ids: ${JSON.stringify({ ids })}`);
                callback(ids);
            });
        }
        
        static getStats(userIds, resultId, sex, sheetGetter, callback) {
            logger.info(`getStats(userIds.length: ${userIds.length}, resultId: ${resultId})`);
            var ids = userIds.slice(0, userIds.length);
            let peoplesSheet = [];
            var length = userIds.length;
            var fields = ["sex", "bdate",
            "screen_name", "country", "city", "site", "twitter", "facebook",
            "instagram", "mobile_phone", "IE", "SN", "TF", "JP", "MBTI",
            "friends", "groups"];
            var filters = {
                sex: ["male", "female"],
                MBTIs: ["ISTJ", "ISTP", "ISFJ", "ISFP", "INTJ", "INTP", "INFJ", "INFP", "ESTJ", "ESTP", "ESFJ", "ESFP", "ENTJ", "ENTP", "ENFJ", "ENFP"]
            };
            // console.log(`\n ${JSON.stringify({ ids: userIds, resultId: resultId, groups_count: 30, map_mbti: 1, sex })}\n`);
            request.post({ 
                headers: {authorization: header}, 
                url: `${API_URL}/users`, 
                body: { ids: ids, filters: filters, fields }, json: true, timeout: 86400000 }, 
                function (err, httpResponse, body) {
                if (err) {
                    logger.error('upload failed:', err);

                    callback(null);
                    return;
                }
                //let jsonResponse = JSON.stringify(body);
                //logger.info('Upload successful! getStats  Server responded with:', jsonResponse);
                //console.log(`Upload successful! getStats Server responded with:`, jsonResponse);

               if (body == 'Unauthorized Access') {
                    console.log(body);
                    logger.error(body);
                    callback(null);
                    return;
               }

                var model = null;
                var sheet = sheetGetter();
                //console.log(`sheet: ${JSON.stringify(sheet)}`);
                try {
                    model = SocialStorageService.toModel(body);

                    for (let i = 0; i < body.length; i++) {
                        sheet = SocialStorageService.addPeopleToSheet(sheet, body[i]);
                    }
                }
                catch(ex){
                    console.log(ex);
                    logger.error(ex);
                }

                if (model.stats.stats.mbti_stat.count == 0) {
                    console.log(`error getStats(resultId: ${resultId}! getStats Server responded with:`, body);
                    callback(null);
                    return;
                }

                SocialStorageService.getMbtiMap(ids, resultId, (data) => {
                    if (data == null) {
                        callback(model, sheet);
                    }

                    logger.info(`keys: ${Object.keys(data)}`);
                    if (Object.keys(data)[0] == 'message') { 
                        logger.info(`keys: ${JSON.stringify(data)}`);
                    }
                    logger.info(`people_main_distibution: ${JSON.stringify(data.people_main_distibution)}`);
                    logger.info(`life_main_distibution: ${JSON.stringify(data.life_main_distibution)}`);
                    logger.info(`relations_distribution: ${JSON.stringify(data.relations_distribution)}`);
                    console.log('getMbtiMap');
                    console.log(Object.keys(data));
                    model.stats.stats.popular_groups_stat.stats = SocialStorageService.toObject(data.topn_groups);
                    
                    model.stats.stats.people_main_stat.stats = SocialStorageService.toList(data.people_main_distibution, (prop) => data.people_main_distibution[prop] / length);
                    model.stats.stats.people_main_stat.count = length;

                    model.stats.stats.life_main_stat.stats = SocialStorageService.toList(data.life_main_distibution, (prop) => data.life_main_distibution[prop] / length);
                    model.stats.stats.life_main_stat.count = length;

                    model.stats.stats.relation_stat.stats = SocialStorageService.toList(data.relations_distribution, (prop) => data.relations_distribution[prop] / length);
                    model.stats.stats.relation_stat.count = length;
                    callback(model, sheet);
                });

            }, error => logger.info(error));
        }

        /**
         * 
         * @param {{phone: string, hash_type: {none, sha2_256, sha3_256, sha2_256_mod}}} params 
         * @param {Function} callback 
         */
        static getUserByPhone(params, callback){
            logger.info(`getUserByPhone:`);
            //console.log(`getUserByPhone: ${JSON.stringify(params)}`);

            var phone = params.phone;

            request(
                `${API_URL}/userByPhone/${params.phone}?fields=MBTI,IE,SN,TF,JP,psy_type,psy_type64&hash_type=${params.hash_type}`, 
                {
                    'auth' : {
                        'user': credentials.user,
                        'pass': credentials.pass,
                        'sendImmediately': false
                    }
                },
                (err, response, resBody) => {
                    var body = JSON.parse(resBody);
                    if (err) {
                        logger.error('getUserByPhone failed:', err);
                        callback(null);
                        return;
                    }

                    var result = ['deactivated,id,TF,SN,last_name,first_name,JP,MBTI,psy_type64,IE,psy_type'];
                    var columns = result[0].split(',');
                    var line = [];
                    line.push(phone.toString());
                    
                    for (var i = 0; i < columns.length; i++) {
                        line.push((body[columns[i]] || ' ').toString());
                    }

                    var conf = {
                        name: 'getUserByPhone'
                    };
                    conf.cols = [{caption: 'phone', type: 'string'}].concat(columns.map(function(p) {return {caption: p, type: 'string'}}));
                    conf.rows = [];
                    conf.rows.push(line);

                    callback([conf]);
                }
            )
        }

        /**
         * 
         * @param {{phones: string[], hash_type: {none, sha2_256, sha3_256, sha2_256_mod}}} params 
         * @param {function} callback 
         */
        static getUserByPhones(params, callback){
            // https://api.datafuel.ru/userByPhone/79153880401?fields=MBTI,IE,SN,TF,JP,psy_type,psy_type64
            console.log(`getUserByPhones`);
            console.log(JSON.stringify(params));

            request.post({ 
                url: `${API_URL}/usersByPhone`,
                headers: {authorization: header},
                body: {phones: params.phones, fields: ['MBTI','IE','SN','TF','JP','psy_type','psy_type64'], hash_type: params.hash_type},
                json: true, 
                timeout: 86400000,
                function (err, httpResponse, body) {
                    if (err) {
                        logger.error('upload failed:', err);
                        console.log(err);
                        callback(null);
                        return;
                    }
                   // let jsonResponse = JSON.stringify(body);
                    //logger.info('Upload successful!  Server responded with:', jsonResponse);
                   //  console.log('Upload successful!  Server responded with:', jsonResponse);
                
                   /* if (jsonResponse.indexOf('Error') > 0) {
                        callback(null);
                        return;
                    }*/
                console.log(`body`);
                console.log(body);
                    var result = ['deactivated,id,TF,SN,last_name,first_name,JP,MBTI,psy_type64,IE,psy_type'];
                    var params = result[0].split(',');
                    var line = '';
                    for (var j = 0; j < body.length; j++) {
                        for (var i = 0; i < params.length; i++) {
                            line += body[j][params[i]];
                            line += ',';
                        }
                    }
                
                    line = line.trim(',');
                    result.push(line);
                
                    callback(result.join('\n'));
                }}, 
                error => logger.info(error));
            }

        static toObject(list) {
            var result = [];
            for (var i = 0; i < list.length; i++) {
                var item = {};
                item[list[i].id] = list[i].count;
                result.push(item);
            }

            return result;
        }

        static getMbtiMap(userIds, resultId, callback) {
            //console.log(`getMbtiMap(userIds.length: ${userIds.length}, resultId: ${resultId})`);
            logger.info(`getMbtiMap(userIds.length: ${userIds.length}, resultId: ${resultId})`);
            var fields = ["sex", "bdate",
            "screen_name", "country", "city", "site", "twitter", "facebook",
            "instagram", "mobile_phone", "IE", "SN", "TF", "JP", "MBTI",
            "friends", "groups"];

            var filters = {
                sex: ["male", "female"],
                MBTIs: ["ISTJ", "ISTP", "ISFJ", "ISFP", "INTJ", "INTP", "INFJ", "INFP", "ESTJ", "ESTP", "ESFJ", "ESFP", "ENTJ", "ENTP", "ENFJ", "ENFP"],
            };

            request.post({ 
                headers: {authorization: header},
                url: `${API_URL}/stats/users`, 
                body: { ids: userIds }, 
                json: true, timeout: 86400000 }, function (err, httpResponse, body) {
                if (err) {
                    logger.error('upload failed:', err);
                    callback(null);
                    return;
                }
                let jsonResponse = JSON.stringify(body);
                //logger.info('Upload successful!  Server responded with:', jsonResponse);
                 console.log('Upload successful!  Server responded with:', jsonResponse);

               /* if (jsonResponse.indexOf('Error') > 0) {
                    callback(null);
                    return;
                }*/

                callback(body);
            }, error => logger.info(error));
        }

        static toModel(peoples) {
            var model = SocialStorageService.createNewModel();
            var countries = {};
            var cities = {};
            var groups = {};
            var groupCount = 0;
            //console.log(peoples[0]);
            for (var i = 0; i < peoples.length; i++) {
                var people = peoples[i];

                if (people.MBTI) {
                    model.stats.segments[people.MBTI] = model.stats.segments[people.MBTI] || [];
                    model.stats.segments[people.MBTI].push(people.id);
                }

                /*var pGroups = people.groups || [];
                for (var g = 0; g < 10 && g < pGroups.length; g++){
                    groups[pGroups[g]] = (groups[pGroups[g]] || 0) + 1;
                }
                groupCount +=pGroups.length;*/

                model.stats.stats.bday_stat.count++;
                if (SocialStorageService.getAgeRange(people.bdate) != 'no-date')
                {
                    model.stats.stats.bday_stat.stats.distribution[SocialStorageService.getAgeRange(people.bdate)]++;
                }

                model.stats.stats.country_stat.count++;

                if (people.country) {
                    countries[people.country.name] = countries[people.country.name] || 0;
                    countries[people.country.name]++;
                }

                if (people.city) {
                    cities[people.city.name] = cities[people.city.name] || 0;
                    cities[people.city.name]++;
                }

                model.stats.stats.sex_stat.count++;

                if (people.sex == 'male') {
                    model.stats.stats.sex_stat.stats.M++;
                } else {
                    model.stats.stats.sex_stat.stats.F++;
                }
            }

            /*let propNames = Object.getOwnPropertyNames(countries);
            for (var i = 0; i < propNames.length; i++){
                var item = {};
                item[propNames[i]] = countries[propNames[i]];
                model.stats.stats.country_stat.stats.push(item);
            }
            model.stats.stats.country_stat.stats = SocialStorageService.toList(countries);*/

            /*model.stats.stats.popular_groups_stat.stats = SocialStorageService.toList(groups).slice(0, 11);
            model.stats.stats.popular_groups_stat.count = groupCount;*/

            let propNames = Object.getOwnPropertyNames(cities);
            for (var i = 0; i < propNames.length; i++){
                var item = {};
                item[propNames[i]] = cities[propNames[i]] / peoples.length;
                model.stats.stats.country_stat.city_stat.count++;
                model.stats.stats.country_stat.city_stat.stats.push(item);

                model.stats.stats.city_stat.count++;
                model.stats.stats.city_stat.stats.push(item);
            }
            
            /*propNames = Object.getOwnPropertyNames(model.stats.segments);
            for (var i = 0; i < propNames.length; i++){
                var item = {};
                item[propNames[i]] = model.stats.segments[propNames[i]].length / peoples.length;

                model.stats.stats.mbti_stat.stats.push(item);
                model.stats.stats.mbti_stat.count += model.stats.segments[propNames[i]].length;
            }*/

            model.stats.stats.mbti_stat.stats = SocialStorageService.toList(model.stats.segments, (prop) => model.stats.segments[prop].length / peoples.length);
            model.stats.stats.mbti_stat.count = peoples.length;

            return model;
        }

        static toList(object, calculateValue) {
            var arr = [];
            var propNames = Object.getOwnPropertyNames(object);
            for (var i = 0; i < propNames.length; i++){
                var item = {};
                item[propNames[i]] = calculateValue ? calculateValue(propNames[i]) : object[propNames[i]];
                arr.push(item);
            }
           // console.log('toList');
           // console.log(arr);
            return arr;
        }

        static getAgeRange(date) {
            var one_year=1000*60*60*24*365;
            var d = date ? date.split('-'): [];
            var age = (new Date()  - new Date(d[2],d[1],d[0]))/one_year;

            if (age <= 18) {
                return '0-18';
            }

            if (age <= 21) {
                return '18-21';
            }

            if (age <= 24) {
                return '21-24';
            }

            if (age <= 27) {
                return '24-27';
            }

            if (age <= 30) {
                return '27-30';
            }

            if (age <= 35) {
                return '30-35';
            }

            if (age <= 45) {
                return '35-45';
            }

            if (age < 100) {
                return '45-99';
            }
            return 'no-date';
        }

        static addPeopleToSheet(sheet, people) {
            var keys = Object.getOwnPropertyNames(peopleModel);
            //console.log(`key: ${keys}`);
            //console.log(`people: ${JSON.stringify(people)}`);
            if (sheet == null || sheet.rows == null) {
                var conf = {
                    name: 'getUserByPhone'
                };
                conf.cols = keys.map(function(p) {return {caption: p, type: 'string'}});
                conf.rows = [];

                sheet = conf;
            }

            var line = [];
            keys.forEach(key => {
                line.push(JSON.stringify(people[key]));
            });

            sheet.rows.add(line);
            return sheet;
        }

        static createNewModel() {
            return {
                stats: {
                   stats: {
                       bday_stat: {
                           count: 0,
                           stats: {
                               mean:0,
                               median:0,
                               max:0,
                               min:0,
                               fst_quantile:0,
                               last_quantile:0,
                               std:0,
                               distribution:{"0-18":0,"18-21":0,"21-24":0,"24-27":0,"27-30":0,"30-35":0,"35-45":0,"45-99":0}
                           }
                       },
                       city_stat:{count:0,stats:[]},
                       country_stat:{
                           count:0,
                           stats:[],
                           city_stat:{count:0,stats:[]}
                       },
                       people_main_stat:{count:0,stats:[]},
                       life_main_stat:{count:0,stats:[]},
                       sex_stat:{count:0,stats:{M:0,F:0}},
                       relation_stat:{count:0,stats:[]},
                       popular_groups_stat:{count:0,stats:[]},
                       interests:{count:0,stats:[]},
                       mbti_stat:{count:0,stats:[]}
                   },
                   
                   segments:{ISTP:[],ISTJ:[],ISFP:[],ISFJ:[],INTP:[],INTJ:[],INFP:[],INFJ:[],ESTP:[],ESTJ:[],ESFP:[],ESFJ:[],ENTP:[],ENTJ:[],ENFP:[],ENFJ:[]}
               },
               added:0
           };
        }
    }

    const peopleModel = {
        friends: [],
        id: '',
        site: '',
        twitter: '',
        groups: [],
        city: {id: null, name: ''},
        mobile_phone: {},
        MBTI: '',
        JP: null,
        last_name: '',
        bdate: '',
        screen_name: '',
        facebook: null,
        instagram: null,
        is_closed: false,
        deactivated: false,
        is_bad: false,
        sex: '',
        first_name: '',
        IE: null,
        country: {},
        TF: null,
        SN: null
    }

    module.exports = SocialStorageService;
})(module.exports, null, module);