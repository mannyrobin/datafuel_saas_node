var dataBaseService = require('../../src/server/business/dataBaseService.js');
var analisysController = require('../../src/server/web/analisys-controller.js');

var request = require('superagent');
var user1 = request.agent('http://localhost:3002');

var fs = require('fs');
var chai = require('chai');
var spies = require('chai-spies');

var expect = chai.expect;
var uuid = require('node-uuid');
var Rates = require('../../src/server/model/rates')(dataBaseService);
var Capabilities = require('../../src/server/model/capabilities');

var url = 'http://localhost:3002';

let userId = 0;

chai.use(spies);

function login(done) {
    user1.post(`${url}/login`)
        .send({
            context: {
                user: {
                    id: userId,
                    first_name: `test user ${userId}`
                }
            }
        }).end((error, response, body) => {
            expect(response.statusCode).to.equal(200);
            done();
        });
}

function waitForIdle(type, callback, count = 0) {
    let ready = false;

    if (count > 500) {
        return;
    }

    user1.get(`${url}/checkStatus?type=${type}`)
        .end((error, response, body) => {
            ready = '{"busy":false,"progress":0}' == response.text;
            if (ready) {
                count = 0;
                callback();
            } else {
                waitForIdle(type, callback, count++);
            }
        });
}

var formData = {
    // Pass a simple key-value pair 
    //  my_field: 'my_value',
    // Pass data via Buffers 
    //  my_buffer: new Buffer([1, 2, 3]),
    // Pass data via Streams 
    //  my_file: fs.createReadStream( 'C:\Work\DataFuel\Source\test\ESFP.txt'),
    // Pass multiple values /w an Array 
    /*  attachments: [
        fs.createReadStream(__dirname + '/test/ESFP.txt')
      ],
      // Pass optional meta-data with an 'options' object with style: {value: DATA, options: OPTIONS} 
      // Use case: for some types of streams, you'll need to provide "file"-related information manually. 
      // See the `form-data` README for more information about options: https://github.com/form-data/form-data 
      custom_file: {
        value:  fs.createReadStream('/test/ESFP.txt'),
        options: {
          filename: 'ESFP.txt',
          contentType: 'plane/text'
        }
      }*/
};

describe('analisys-controller - unauthorization', () => {
    before((done) => {
        user1.delete(`${url}/login`)
            .end(done);
    });
/*
    it('checkStatus', done => {
        user1.get(`${url}/checkStatus?type=analisys`)
            .end((error, response, body) => {
                console.log(JSON.stringify(response.redirects));
                expect(response.redirects.length).to.equal(0);
                expect(response.statusCode).to.equal(401);
                done();
            });
    });*/

    it('upload', done => {
        user1.post(`${url}/upload`)
            .send({
                files: {
                    file: {}
                }
            })
            .end((error, response, body) => {
                expect(response.redirects.length).to.equal(0);
                console.log(JSON.stringify(response.statusCode));
                expect(response.statusCode).to.equal(401);
                done();
            });
    });

    it('analisys - get', done => {
        user1.get(`${url}/analisys`)
            .end((error, response, body) => {
                expect(response.redirects.length).to.equal(1);
                expect(response.redirects).deep.equal(['http://localhost:3002/login']);
                expect(response.statusCode).to.equal(200);
                done();
            });
    });

    it('analisys - post', done => {
        user1.post(`${url}/analisys`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.redirects.length).to.equal(0);
                expect(response.statusCode).to.equal(401);
                done();
            });
    });
/*
    it('segment', done => {
        user1.post(`${url}/segment`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.redirects.length).to.equal(2);
                expect(response.redirects).deep.equal(['http://localhost:3002/', 'http://localhost:3002/login']);
                done();
            });
    });*/
});


describe('analisys-controller - new user', () => {

    before((done) => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            done();
        });
    });

    beforeEach((done) => {
        login(done);
    });

    it('checkStatus', done => {
        user1.get(`${url}/checkStatus?type=analisys`)
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);
                done();
            });
    });

    it('upload - undefined type', done => {
        user1.post(`${url}/upload`)
            .send({
                files: {
                    file: {
                        data: 'https://vk.com/id2781070'
                    }
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(501);
                done();
            });
    });

    it('upload - analisys', done => {
        user1.post(`${url}/upload?type=analisys`)
            .send({
                files: {
                    file: {
                        data: 'https://vk.com/id2781070'
                    }
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(403);
                done();
            });
    });
/*
    it('upload', done => {
        user1.post(`${url}/upload?type=segment`)
            .send({
                files: {
                    file: {
                        data: 'https://vk.com/id2781070'
                    }
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(403);
                done();
            });
    });*/

    it('analisys', done => {
        user1.post(`${url}/analisys`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(403);
                done();
            });
    });
/*
    it('segment', done => {
        user1.post(`${url}/segment`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(403);
                done();
            });
    });*/
});

describe('analisys-controller - user has analisys capability', () => {
    before((done) => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            login(() => {
                dataBaseService.setUserLicense(userId, Rates.getAll().filter(r => r.Permissions == Capabilities.Analisys)[0].Id, () => user1.delete(`${url}/login`)
                    .end(done));
            });
        });
    });

    beforeEach((done) => {
        login(done);
    });

    afterEach((done) => {
        // Resets user profile to default state
        user1.delete(`${url}/login`)
            .end(done);
    });

    it('checkStatus', done => {
        user1.get(`${url}/checkStatus?type=analisys`)
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);
                expect(response.text).to.equal('{"busy":false,"progress":0}');
                done();
            });
    });

    it('analisys', done => {
        user1.post(`${url}/analisys`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=analisys`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);
                        expect(response.text).to.equal('{"busy":true,"progress":0}');
                        done();
                    });
            });
    });
/*
    it('segment', done => {
        user1.post(`${url}/segment`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(403);
                done();
            });
    });
*/
    it('upload segment', done => {
        user1.post(`${url}/upload?type=segment`)
            .send({
                files: {
                    file: {
                        data: 'https://vk.com/id2781070'
                    }
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(403);
                done();
            });
    });
    /*
        it('upload analisys', done => {
            user1.post(`${url}/upload?type=analisys`)
                .send({
                    data: {
                        groupId: 'https://vk.com/id2781070',
                        name: `this.name`,
                        notificationRequired: false
                    }
                })
                .end((error, response, body) => {
                    expect(response.statusCode).to.equal(200);
                    done();
                });
        });*/
});


describe('analisys-controller - user has segments capability', () => {
    before((done) => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            login(() => {
                dataBaseService.setUserLicense(userId, Rates.getAll().filter(r => r.Permissions & Capabilities.Segmentation > 0)[0].Id, () => user1.delete(`${url}/login`)
                    .end(done));
            });
        });
    });

    beforeEach((done) => {
        login(done);
    });

    afterEach((done) => {
        // Resets user profile to default state
        user1.delete(`${url}/login`)
            .end(done);
    });

    it('checkStatus', done => {
        user1.get(`${url}/checkStatus?type=analisys`)
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);
                expect(response.text).to.equal('{"busy":false,"progress":0}');
                done();
            });
    });

    it('analisys', done => {
        user1.post(`${url}/analisys`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=analisys`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);
                        expect(response.text).to.equal('{"busy":true,"progress":0}');
                        done();
                    });
            });
    });
/*
    it('segment', done => {
        user1.post(`${url}/segment`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=segment`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);
                        expect(response.text).to.equal('{"busy":true,"progress":0}');
                        done();
                    });
            });
    });*/

    /* it('upload segment', done => {
         user1.post(`${url}/upload?type=segment`)
             .send({
                 files: {
                     file: {
                         data: 'https://vk.com/id2781070'
                     }
                 }
             })
             .end((error, response, body) => {
                 expect(response.statusCode).to.equal(200);
 
                 user1.get(`${url}/checkStatus?type=segment`)
                     .end((error, response, body) => {
                         expect(response.statusCode).to.equal(200);
                         expect(response.text).to.equal('{"busy":true}');
                         done();
                     });
             });
     });
 
     it('upload analisys', done => {
         user1.post(`${url}/upload?type=analisys`)
             .send({
                 data: {
                     groupId: 'https://vk.com/id2781070',
                     name: `this.name`,
                     notificationRequired: false
                 }
             })
             .end((error, response, body) => {
                 expect(response.statusCode).to.equal(200);
 
                 user1.get(`${url}/checkStatus?type=analisys`)
                     .end((error, response, body) => {
                         expect(response.statusCode).to.equal(200);
                         expect(response.text).to.equal('{"busy":true}');
                         done();
                     });
             });
 });*/
});

describe('analisys-controller - user has no money and no remaining requests', () => {

    before((done) => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            console.log(userId);
            login(() => {
                user1.post(`${url}/select-rate`)
                    .send({
                        data: {
                            rateId: 10
                        }
                    })
                    .set('Content-Type', 'application/json')
                    .end(function (error, response, body) {
                        expect(response.statusCode).to.equal(200);
                        done();
                    });
            });
        });
    });

    beforeEach((done) => {
        login(done);
    });

    afterEach((done) => {
        // Resets user profile to default state
        user1.delete(`${url}/login`)
            .end(done);
    });

    it('analisys', done => {
        user1.post(`${url}/analisys`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=analisys`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('analisys', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('0');
                                expect(response.body.Requests).to.eql('0');

                                done();
                            });
                        });
                    });
            });
    });
/*
    it('segment', done => {
        user1.post(`${url}/segment`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=segment`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('segment', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('0');
                                expect(response.body.Requests).to.eql('0');

                                done();
                            });
                        });
                    });
            });
    });*/
});

describe('analisys-controller - user has not enough money and no remaining requests. The selected rateId: 10', () => {

    before((done) => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            console.log(userId);
            login(() => {
                user1.post(`${url}/select-rate`)
                    .send({
                        data: {
                            rateId: 10
                        }
                    })
                    .set('Content-Type', 'application/json')
                    .end(function (error, response, body) {
                        expect(response.statusCode).to.equal(200);
                        dataBaseService.addMoney(userId, 2, () => done());
                    });
            });
        });
    });

    beforeEach((done) => {
        login(done);
    });

    afterEach((done) => {
        // Resets user profile to default state
        user1.delete(`${url}/login`)
            .end(done);
    });

    it('analisys', done => {
        user1.post(`${url}/analisys`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=analisys`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('analisys', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('2');
                                expect(response.body.Requests).to.eql('0');

                                done();
                            });
                        });
                    });
            });
    });
/*
    it('segment', done => {
        user1.post(`${url}/segment`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=segment`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('segment', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('2');
                                expect(response.body.Requests).to.eql('0');

                                done();
                            });
                        });
                    });
            });
    });*/
});

describe('analisys-controller - user has not enough money and no remaining requests. The selected rateId: 11', () => {

    before((done) => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            console.log(userId);
            login(() => {
                user1.post(`${url}/select-rate`)
                    .send({
                        data: {
                            rateId: 11
                        }
                    })
                    .set('Content-Type', 'application/json')
                    .end(function (error, response, body) {
                        expect(response.statusCode).to.equal(200);
                        dataBaseService.addMoney(userId, 200, () => done());
                    });
            });
        });
    });

    beforeEach((done) => {
        login(done);
    });

    afterEach((done) => {
        // Resets user profile to default state
        user1.delete(`${url}/login`)
            .end(done);
    });

    it('analisys', done => {
        user1.post(`${url}/analisys`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=analisys`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('analisys', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('200');
                                expect(response.body.Requests).to.eql('0');

                                done();
                            });
                        });
                    });
            });
    });
/*
    it('segment', done => {
        user1.post(`${url}/segment`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=segment`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('segment', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('200');
                                expect(response.body.Requests).to.eql('0');

                                done();
                            });
                        });
                    });
            });
    });*/
});

describe('analisys-controller - user has 3 rub and no remaining requests', () => {
    before((done) => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            console.log(userId);
            login(() => {
                user1.post(`${url}/select-rate`)
                    .send({
                        data: {
                            rateId: 10
                        }
                    })
                    .set('Content-Type', 'application/json')
                    .end(function (error, response, body) {
                        expect(response.statusCode).to.equal(200);

                        dataBaseService.addMoney(userId, 3, () => done());
                    });
            });
        });
    });

    beforeEach((done) => {
        login(done);
    });

    afterEach((done) => {
        // Resets user profile to default state
        user1.delete(`${url}/login`)
            .end(done);
    });

    it('analisys', done => {
        user1.post(`${url}/analisys`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=analisys`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('analisys', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('0');
                                expect(response.body.Requests).to.eql('999');

                                done();
                            });
                        });
                    });
            });
    });
/*
    it('segment', done => {
        user1.post(`${url}/segment`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=segment`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('segment', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('0');
                                expect(response.body.Requests).to.eql('998');

                                done();
                            });
                        });
                    });
            });
    });*/
});

describe('analisys-controller - user has 30 rub and no remaining requests, The selected rateId: 10', () => {
    before((done) => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            console.log(userId);
            login(() => {
                user1.post(`${url}/select-rate`)
                    .send({
                        data: {
                            rateId: 10
                        }
                    })
                    .set('Content-Type', 'application/json')
                    .end(function (error, response, body) {
                        expect(response.statusCode).to.equal(200);

                        dataBaseService.addMoney(userId, 30, () => done());
                    });
            });
        });
    });

    beforeEach((done) => {
        login(done);
    });

    afterEach((done) => {
        // Resets user profile to default state
        user1.delete(`${url}/login`)
            .end(done);
    });

    it('analisys', done => {
        user1.post(`${url}/analisys`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=analisys`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('analisys', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('27');
                                expect(response.body.Requests).to.eql('999');

                                done();
                            });
                        });
                    });
            });
    });
/*
    it('segment', done => {
        user1.post(`${url}/segment`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=segment`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('segment', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('27');
                                expect(response.body.Requests).to.eql('998');

                                done();
                            });
                        });
                    });
            });
    });*/
});

describe('analisys-controller - user has 3000 rub and no remaining requests, The selected rateId: 11', () => {
    before((done) => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            console.log(userId);
            login(() => {
                user1.post(`${url}/select-rate`)
                    .send({
                        data: {
                            rateId: 11
                        }
                    })
                    .set('Content-Type', 'application/json')
                    .end(function (error, response, body) {
                        expect(response.statusCode).to.equal(200);

                        dataBaseService.addMoney(userId, 3000, () => done());
                    });
            });
        });
    });

    beforeEach((done) => {
        login(done);
    });

    afterEach((done) => {
        // Resets user profile to default state
        user1.delete(`${url}/login`)
            .end(done);
    });

    it('analisys', done => {
        user1.post(`${url}/analisys`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=analisys`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('analisys', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('2000');
                                expect(response.body.Requests).to.eql('999999');

                                done();
                            });
                        });
                    });
            });
    });
/*
    it('segment', done => {
        user1.post(`${url}/segment`)
            .send({
                data: {
                    groupId: 'https://vk.com/id2781070',
                    name: `this.name`,
                    notificationRequired: false
                }
            })
            .end((error, response, body) => {
                expect(response.statusCode).to.equal(200);

                user1.get(`${url}/checkStatus?type=segment`)
                    .end((error, response, body) => {
                        expect(response.statusCode).to.equal(200);

                        waitForIdle('segment', () => {
                            user1.get(`${url}/user-info`).end((error, response, body) => {
                                expect(response.body.Money).to.eql('2000');
                                expect(response.body.Requests).to.eql('999998');

                                done();
                            });
                        });
                    });
            });
    });*/
});

/*
describe('analisys-controller - user has not enough money and no remaining requests. The selected rateId: 11', () => {

    it('performance and quality', done => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            const maxId = userId + 100;
            for (; userId < maxId; userId++) {
                console.log(userId);
                login(() => {
                    user1.post(`${url}/select-rate`)
                        .send({
                            data: {
                                rateId: 11
                            }
                        })
                        .set('Content-Type', 'application/json')
                        .end(function (error, response, body) {
                            expect(response.statusCode).to.equal(200);
                            dataBaseService.addMoney(userId, 200000, () => {
                                user1.post(`${url}/analisys`)
                                    .send({
                                        data: {
                                            groupId: 'https://vk.com/id2781070',
                                            name: `this.name`,
                                            notificationRequired: false
                                        }
                                    })
                                    .end((error, response, body) => {
                                        expect(response.statusCode).to.equal(200);
                                    });
                            });
                        });
                });
            }
        });

    });
});*/