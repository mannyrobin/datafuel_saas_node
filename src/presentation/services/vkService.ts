
import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { LiteEvent, ILiteEvent } from '../LiteEvent/LiteEvent';
import { CommonService } from './commonService';

const API_URL = `${window.location.protocol}//${window.location.host}`;

@Injectable()
export class vkService {

    constructor(
        private http: Http,
        private service: CommonService) {

    }

    createTargetGroup(name: string, ids: number[], account_id: number, callback) {
        if (!window['VK']._apiId || account_id == null) {
            this.service.updateExportLimit(ids.length);
            return;
        }

        window['VK'].api('ads.createTargetGroup', { account_id, name, version: 5.73 }, (res) => {
            if (res.response) {
                this.importTargetContacts(account_id, name, res.response.id, ids, callback);
            } else if (res.error) {
                alert(res.error.error_msg);
            }
        });
    }

    importTargetContacts(account_id, name, id, ids: number[], callback) {
        if (!window['VK'] || account_id == null) {
            return;
        }

        console.log(`importTargetContacts (account_id: ${account_id}, name: ${name}, id :${id}, length: ${ids.length})`);

        this.import(account_id, name, id, ids, 0, callback);
    }

    import(account_id: number, name: string, id: number, ids: number[], count: number, callback) {
        console.log(`count: ${count}`);
        const step: number = 1000;
        if (count * step >= ids.length) {
            callback(100);
            return;
        }

        let data: string[] = [];
     /*   for (let i = count * step; i < (count + 5) * step && i * step < ids.length; i++)
            data.push(ids.slice(i * step, Math.min(ids.length, (i + 1) * step)).join(','));
        */

      /*  if (data.length == 0) {
            return;
        }*/
        setTimeout(() => {
            callback((count * step) / ids.length * 100);
          /*  window['VK'].api(
                        'execute',
                        {
                            code: `
								API.ads.importTargetContacts(
									{"target_group_id": "${id}",
                                    "account_id": "${account_id}",
									"name": "${name}",
                                    "contacts": "${ids.slice(count * step, Math.min(ids.length, (count + 1) * step)).join(',')}"
                                });
							`
                        }*/
            let lengthIds = Math.min((count + 1) * step, ids.length);
          window['VK'].api('ads.importTargetContacts', {
                account_id,
                name,
                target_group_id: id,
                contacts: ids.slice(count * step, lengthIds).join(','), 
                version: 5.73
            }, res => {
                this.service.updateExportLimit(res.response);
                this.import(account_id, name, id, ids, (count + 1), callback);
            });
        }, 30000);
    }

    /**var members = [];
VK.api(
	'groups.getMembers', 
	{"group_id": 'amazing.comics'}, 
	res => {
		let offset = 0; 
console.log(res.response);
		while(res.response.count > offset) {
		console.log(offset);
		offset += 25000;
			VK.api(
				'execute', 
				{
					code: `var result = []; var cnt = ${offset}+24000;
							var offset = ${offset};
    						while(offset < cnt) {
								result.push(API.groups.getMembers(
									{"group_id": "amazing.comics",

									"offset": offset}).users);

								offset = offset+1000;
							}
    				return result;`
    			}, res => {members = members.concat(res.response); console.log(members.length)})
    		}
 	})   	 */
}