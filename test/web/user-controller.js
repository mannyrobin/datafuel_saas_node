var dataBaseService = require('../../src/server/business/dataBaseService.js');
var request = require('superagent');
var user1 = request.agent('http://localhost:3002');

var express = require('express');
var expect = require('chai').expect;
var uuid = require('node-uuid');

var url = 'http://localhost:3002';

let userId = 0;

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

describe('user-controller', () => {

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

    describe('Default values', () => {

        it('returns the actual list of rates', (done) => {
            user1.get(`${url}/rates`).end((error, response, body) => {
                expect(response.statusCode).to.equal(200);
                expect(response.body).deep.equal([{ 'Name': 'Rate1', 'Request': '1000', 'Cost': 3, 'Id': 10 }, { 'Name': 'Rate2', 'Request': '1000000', 'Cost': 1000, 'Id': 11 }]);
                done();
            });
        });

        it('returns the user info', (done) => {
            user1.get(`${url}/user-info`).end((error, response, body) => {
                expect(response.body).to.eql({
                    Name: `test user ${userId}`,
                    Money: '0',
                    Requests: '0',
                    AccountId: null,
                    Email: ''
                });
                done();
            });
        });

        it('returns the default user rate', (done) => {
            user1.get(`${url}/user-rate-id`).end((error, response, body) => {
                expect(response.body).to.eql({ Id: null });
                done();
            });
        });

        it('returns the default user email', (done) => {
            user1.get(`${url}/user-email`).end((error, response, body) => {
                expect(response.body).to.eql({ email: '' });
                done();
            });
        });
    });

    describe('post methods', () => {
        it('update user profile', done => {
            user1.post(`${url}/user-profile`)
                .send({
                    userProfile: {
                        Email: 'test@mail.com',
                        AccountId: '1111'
                    }
                })
                .set('Content-Type', 'application/json')
                .end(function (error, response, body) {
                    expect(response.statusCode).to.equal(200);
                    user1.get(`${url}/user-info`).end((error, response, body) => {
                        var userProfile = {
                            Name: `test user ${userId}`,
                            Money: '0',
                            Requests: '0',
                            AccountId: '1111',
                            Email: 'test@mail.com'
                        };
                        expect(response.body).to.eql(userProfile);

                        var activity = {
                            Email: 'test@mail.com',
                            AccountId: '1111',
                            Id: `${userId}`
                        };
                        const message = `обновление профайла пользователя: ${JSON.stringify(activity)}`;
                        dataBaseService.getActivities(userId, (activities) => {
                            for (let i = 0; i < activities.length; i++) {
                                if (activities[i].Description == message) {
                                    done();
                                    return;
                                }
                            }

                            expect(`the expected activity has not been created: ${JSON.stringify(activity)}`).to.equal(true);
                        });
                    });
                });
        });

        it('add money', done => {
            user1.post(`${url}/add-money`)
                .send({ sum: '1000' })
                .set('Content-Type', 'application/json')
                .end(function (error, response, body) {
                    expect(response.statusCode).to.equal(200);
                    user1.get(`${url}/user-info`).end((error, response, body) => {
                        expect(response.body).to.eql({
                            Name: `test user ${userId}`,
                            Money: '1000',
                            Requests: '0',
                            AccountId: null,
                            Email: ''
                        });

                        const message = `пополнение счета на 1000`;
                        dataBaseService.getActivities(userId, (activities) => {
                            for (let i = 0; i < activities.length; i++) {
                                if (activities[i].Description == message) {
                                    done();
                                    return;
                                }
                            }

                            expect('the expected activity has not been created').to.equal(true);
                        });
                    });
                });
        });

        it('select rate', done => {
            user1.post(`${url}/select-rate`)
                .send({
                    data: {
                        rateId: 10
                    }
                })
                .set('Content-Type', 'application/json')
                .end(function (error, response, body) {
                    expect(response.statusCode).to.equal(200);

                    user1.get(`${url}/user-rate-id`).end((error, response, body) => {
                        expect(response.body).to.eql({ Id: '10' });

                        dataBaseService.getActivities(userId, (activities) => {
                            const message = `выбор тарифа:`;

                            for (let i = 0; i < activities.length; i++) {
                                if (activities[i].Description.indexOf(message) > -1) {
                                    done();
                                    return;
                                }
                            }

                            expect('the expected activity has not been created').to.equal(true);
                        });
                    });
                });
        });

        it('update email', done => {
            user1.post(`${url}/update-email`)
                .send({
                    data: 'new-email@test.com'
                })
                .set('Content-Type', 'application/json')
                .end(function (error, response, body) {
                    expect(response.statusCode).to.equal(200);

                    user1.get(`${url}/user-email`).end((error, response, body) => {
                        expect(response.body).to.eql({ email: 'new-email@test.com' });
                        const message = `обновление email`;

                        dataBaseService.getActivities(userId, (activities) => {
                            for (let i = 0; i < activities.length; i++) {
                                if (activities[i].Description.indexOf(message) > -1) {
                                    done();
                                    return;
                                }
                            }

                            expect('the expected activity has not been created').to.equal(true);
                        });
                    });
                });
        });
    });

    afterEach((done) => {
        // Resets user profile to default state
        user1.post(`${url}/user-profile`)
            .send({
                userProfile: {
                    Email: '',
                    AccountId: null
                }
            })
            .set('Content-Type', 'application/json')
            .end((error, response, body) => {
                user1.delete(`${url}/login`)
                    .end(done);
            });
    });
});

describe('user-controller without authorization', () => {

    before((done) => {
        dataBaseService.getUsers(users => {
            for (let i = 0; i < users.length; i++) {
                if (userId < users[i].Id) {
                    userId = users[i].Id;
                }
            }

            userId++;
            user1.post(`${url}/user-profile`)
                .send({
                    userProfile: {
                        Email: '',
                        AccountId: null
                    }
                })
                .set('Content-Type', 'application/json')
                .end((error, response, body) => {
                    user1.delete(`${url}/login`)
                        .end(done);
                });
        });
    });

    describe('Default values', () => {

        it('returns the actual list of rates', (done) => {
            user1.get(`${url}/rates`).end((error, response, body) => {
                expect(response.statusCode).to.equal(200);
                expect(response.body).deep.equal([{ 'Name': 'Rate1', 'Request': '1000', 'Cost': 3, 'Id': 10 }, { 'Name': 'Rate2', 'Request': '1000000', 'Cost': 1000, 'Id': 11 }]);
                done();
            });
        });

        it('returns the user info', (done) => {
            user1.get(`${url}/user-info`).end((error, response, body) => {
                expect(response.redirects.length).to.equal(2);
                expect(response.redirects).deep.equal(['http://localhost:3002/', 'http://localhost:3002/login']);
                done();
            });
        });

        it('returns the default user rate', (done) => {
            user1.get(`${url}/user-rate-id`).end((error, response, body) => {
                expect(response.redirects.length).to.equal(2);
                expect(response.redirects).deep.equal(['http://localhost:3002/', 'http://localhost:3002/login']);
                done();
            });
        });

        it('returns the default user email', (done) => {
            user1.get(`${url}/user-email`).end((error, response, body) => {
                expect(response.redirects.length).to.equal(2);
                expect(response.redirects).deep.equal(['http://localhost:3002/', 'http://localhost:3002/login']);
                done();
            });
        });
    });

    describe('post methods', () => {
        it('update user profile', done => {
            user1.post(`${url}/user-profile`)
                .send({
                    userProfile: {
                        Email: 'test@mail.com',
                        AccountId: '1111'
                    }
                })
                .set('Content-Type', 'application/json')
                .end(function (error, response, body) {
                    expect(response.redirects.length).to.equal(2);
                    expect(response.redirects).deep.equal(['http://localhost:3002/', 'http://localhost:3002/login']);
                    done();
                });
        });

        it('add money', done => {
            user1.post(`${url}/add-money`)
                .send({ sum: '1000' })
                .set('Content-Type', 'application/json')
                .end(function (error, response, body) {
                    expect(response.redirects.length).to.equal(2);
                    expect(response.redirects).deep.equal(['http://localhost:3002/', 'http://localhost:3002/login']);
                    done();
                });
        });

        it('select rate', done => {
            user1.post(`${url}/select-rate`)
                .send({
                    data: {
                        rateId: 10
                    }
                })
                .set('Content-Type', 'application/json')
                .end(function (error, response, body) {
                    expect(response.redirects.length).to.equal(2);
                    expect(response.redirects).deep.equal(['http://localhost:3002/', 'http://localhost:3002/login']);
                    done();
                });
        });

        it('update email', done => {
            user1.post(`${url}/update-email`)
                .send({
                    data: 'new-email@test.com'
                })
                .set('Content-Type', 'application/json')
                .end(function (error, response, body) {
                    expect(response.redirects.length).to.equal(2);
                    expect(response.redirects).deep.equal(['http://localhost:3002/', 'http://localhost:3002/login']);
                    done();
                });
        });
    });
});