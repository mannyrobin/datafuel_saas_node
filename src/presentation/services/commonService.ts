import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { LiteEvent, ILiteEvent } from '../LiteEvent/LiteEvent';
import { ExportResultModel } from '../models/exportResultModel';
import { Router } from '@angular/router';

const API_URL = `${window.location.protocol}//${window.location.host}`;

@Injectable()
export class CommonService {
    private static onLogin = new LiteEvent<number>();
    private static onLogout = new LiteEvent<void>();
    public static capabilityChanged = new LiteEvent<void>();

    public get LoggedIn(): ILiteEvent<number> { return CommonService.onLogin; }
    public get LoggingOut(): ILiteEvent<void> { return CommonService.onLogout; }
    public get CapabilityChanged(): ILiteEvent<void> { return CommonService.capabilityChanged; }

    constructor(public http: Http,
        private router: Router) {
    }

    checkStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return response.json();
        }

        if (response.status > 400 && response.status < 500 && window.location.pathname != '/login') {
            window.location.pathname = '/login';
        }

        const error = new Error(response.statusText);

        error.message = response;
        throw error;
    }

    selectRate(rateId: string) {
        return this.http.post(`${API_URL}/select-rate`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: { rateId }
        }).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    getGroupMembers(url, callback) {
        var members = [];
        var parts = url.split('/');

        var groupId = parts.length == 1
            ? parts[0]
            : parts[3];

        window['VK'].api(
            'groups.getMembers',
            { "group_id": groupId, version: 5.73 },
            res => {
                let offset = 0;
                run();

                function run() {
                    console.log(offset);
                    offset += 25000;
                    window['VK'].api(
                        'execute',
                        {
                            code: `var result = []; var cnt = ${offset}+24000;
							var offset = ${offset};
    						while(offset < cnt) {
								result.push(API.groups.getMembers(
									{"group_id": "${groupId}",

									"offset": offset}).users);

								offset = offset+1000;
							}
    				        return result;`, 
                            version: 5.73
                        }, result => {

                            if (result.response) {
                                for (let i = 0; i < result.response.length; i++) {
                                    members = members.concat(result.response[i]);
                                }
                                console.log(`members: ${members.length}`);
                            } else {
                                console.log('result');
                                console.log(result);
                            }
                            if (res.response.count <= offset + 25000) {
                                callback(members);
                            } else {
                                run();
                            }
                        });
                };


            });
    }

    isLoggedIn() {
        return this.http.get(`${API_URL}/is-logged-in`).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    download(segmentType, resultId, resultName) {
        window.open(`${API_URL}/files?name=${segmentType}&id=${resultId}&resultName=${resultName}`);
    }

    getSegment(name, resultId) {
        return this.http.get(`${API_URL}/segment-ids?name=${name}&id=${resultId}`).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    getUserRate(userId: number = 0) {
        return this.http.get(`${API_URL}/user-rate-id?userId=${userId}`).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    postGetFile(url, data) {
        var mapForm = document.createElement("form");
        mapForm.target = "_blank";
        mapForm.id="stmtForm";
        mapForm.method = "POST";
        mapForm.action = url;
    
        var mapInput = document.createElement("input");
        mapInput.type = "hidden";
        mapInput.name = "data";
        mapInput.value = JSON.stringify(data);
        mapForm.appendChild(mapInput);
        document.body.appendChild(mapForm);
    
        mapForm.submit();
    }

    getUsersByPhones(data: {phones: string[], fileId: string, hash: string, name: string, resultId: string}) {
        this.postGetFile(`${API_URL}/phones`, data);
    }

    searchUsersByPhones(data: {phones: string[], fileId: string, hash: string, name: string, resultId: string}) {
        return this.http.post(`${API_URL}/phones`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        }).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    setPermissions(userId: string, permissions: number) {
        return this.http.post(`${API_URL}/set-permissions`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: { userId, permissions }
        }).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    setRateForUser(userId, rateId) {
        return this.http.post(`${API_URL}/set-rate`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: { userId, rateId }
        }).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    checkAnalisysStatus() {
        return this.http.get(`${API_URL}/checkStatus?type=analisys`).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    checkSegmentationStatus() {
        return this.http.get(`${API_URL}/checkStatus?type=segment`).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    sendFeedback(text) {
        return this.http.post(`${API_URL}/feedback`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: { text }
        }).toPromise();
    }

    playment(sum) {
        return this.http.post(`https://money.yandex.ru/eshop.xml`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },

            sum,
            shopId: 1234,
            scid: 4321
        }).toPromise();
    }

    reduceExportLimit(count) {
        return this.http.post(`${API_URL}/reduce-export-limit`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: { count }
        }).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    addMoney(sum) {
        return this.http.post(`${API_URL}/add-money`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },

            sum,
            shopId: 1234,
            scid: 4321
        }).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    login(session) {
        return this.http.post(`${API_URL}/login`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            context: session
        }).toPromise().then(this.checkStatus).catch(this.checkStatus).then(data => {
            CommonService.onLogin.trigger(parseInt(data['capability']))
        });
    }

    addRequests(userId: string, requests: number) {
        return this.http.post(`${API_URL}/add-requests`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: {
                userId,
                requests
            }
        }).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    addUsers(data) {
        return this.http.post(`${API_URL}/add-users`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data
        }).toPromise();
    }

    removeResult(resultId) {
        return this.http.post(`${API_URL}/result-delete`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: { resultId }
        }).toPromise();
    }

    markResultBroken(resultId) {
        return this.http.post(`${API_URL}/mark-result-broken`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: { resultId }
        }).toPromise();
    }

    logout() {
        return this.http.delete(`${API_URL}/login`).toPromise().then(() => CommonService.onLogout.trigger());
    }

    getResult(id) {
        return this.http.get(`${API_URL}/result?id=${id}`).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    getResults() {
        return this.http.get(`${API_URL}/result-lists`).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    getUserEmail() {
        return this.http.get(`${API_URL}/user-email`).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    getUser() {
        return this.http.get(`${API_URL}/user-info`).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    getUsers() {
        return this.http.get(`${API_URL}/users-info`).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    updateUserEmail(email) {
        this.http.post(`${API_URL}/update-email`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: email
        }).toPromise();
    }

    updateUserAdvertisementId(accountId) {
        this.http.post(`${API_URL}/update-advertisement-id`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: accountId
        }).toPromise();
    }

    runAnalisys(data) {
        return this.http.post(`${API_URL}/analisys`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data
        }).toPromise();
    }

    runLookALike(data) {
        return this.http.post(`${API_URL}/look-a-like`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data
        }).toPromise();
    }

    postFeedback(text) {
        this.http.post(`${API_URL}/feedback`, {
            method: 'POST',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: text
        });
    }

    getRates(billableOnly: boolean = false) {
        return this.http.get(`${API_URL}/rates?billableOnly=${billableOnly}`).toPromise();
    }

    uploadFile(formData) {
        return this.http.post(`${API_URL}/upload`, {
            method: 'POST',
            dataType: 'json',
            processData: false, // Don't process the files
            contentType: false,
            body: formData
        }).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    updateResultName(resultId, name) {
        this.http.post(`${API_URL}/result-name`, {
            method: 'POST',
            dataType: 'json',
            processData: false, // Don't process the files
            contentType: false,
            data: {
                name,
                resultId
            }
        }).toPromise();
    }

    exportSegment(segmentName, resultId, resultName) {
        this.http.post(`${API_URL}/export-segment`, {
            method: 'POST',
            dataType: 'json',
            processData: false, // Don't process the files
            contentType: false,
            data: {
                segmentName,
                resultId,
                resultName
            }
        }).toPromise();
    }

    exportExcel(data: ExportResultModel) {
        return this.http.post(`${API_URL}/excel`, {
            method: 'post',
            dataType: 'json',
            processData: false, // Don't process the files
            contentType: false,
            data
        }).toPromise();
    }

    getExportFile(resultId: number) {
        window.open(`${API_URL}/excel?resultId=${resultId}`);
    }

    cancelRequest(resultId: number) {
        return this.http.post(`${API_URL}/cancel-request`, {
            method: 'POST',
            dataType: 'json',
            processData: false, // Don't process the files
            contentType: false,
            data: {
                resultId,
            }
        }).toPromise();
    }

    updateExportLimit(count) {
        return this.http.post(`${API_URL}/update-export-limit`, {
            method: 'POST',
            dataType: 'json',
            processData: false, // Don't process the files
            contentType: false,
            data: {
                count,
            }
        }).toPromise();

    }

    registerPromoCode(promo: string) {
        return this.http.post(`${API_URL}/set-promo-code`, {
            method: 'POST',
            dataType: 'json',
            processData: false, // Don't process the files
            contentType: false,
            data: {
                promo
            }
        }).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }

    applyPromoCode(promo: string) {
        return this.http.post(`${API_URL}/activate-promo-code`, {
            method: 'POST',
            dataType: 'json',
            processData: false, // Don't process the files
            contentType: false,
            data: {
                promo
            }
        }).toPromise().then(this.checkStatus).catch(this.checkStatus);
    }
}