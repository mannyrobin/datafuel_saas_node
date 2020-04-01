import { Component } from '@angular/core';
import { CommonService } from '../services/commonService';
import { Router } from '@angular/router';

import { AttachFileLightbox } from './attachFileLightbox/attachFileLightbox.component';
import { RequestType } from '../helpers/requestType';
import { Capability } from '../helpers/capabilities';
import { Rate } from '../models/rate';
import { MessageType } from '../dynamicSystemMessage/messageType';
import { ShowDynamicSystemMessageData } from '../messageBus/showDynamicSystemMessageData';
import { UserLicenseChangedMessage } from '../messageBus/userLicenseChangedMessage';
import { MessageBus } from '../messageBus/messageBus';
import { MessageBusEvents } from '../messageBus/messageBusEvents';
import { DataFuelCache } from '../cache/dataFuelCache';

@Component({
    selector: 'analisys-page',
    templateUrl: './analisys.component.html',
    styleUrls: ['./analisys.component.css', '../app/app.css', '../../dist/css/pixeladmin-dark.min.css',
    '../../dist/css/bootstrap.css',
        '../../dist/css/pixeladmin.css', '../../dist/css/themes/default.css'],
    providers: [CommonService]
})

export class AnalisysPage {
    public name: string;
    public fileItem: any;
    public groupId: string;
    public type: string = RequestType.analisys;

    private fileChoosenHandler: any;
    private runAnalisysHandler: any;
    private onModelChangedHandler: any;
    private fileUploader: any;
    private inProgress: boolean = false;

    private notificationRequired: boolean = false;
    private showModal: boolean = false;

    private hasCapability: boolean;
    private fileSelected: boolean = false;
    private ready: boolean = false;

    constructor(
        private service: CommonService,
        private router: Router,
        private capability: Capability,
        private messageBus: MessageBus,
        private cache: DataFuelCache) {

        this.fileChoosenHandler = this.fileChoosen.bind(this);
        this.runAnalisysHandler = this.runAnalisys.bind(this);
        this.onModelChangedHandler = this.updateReadyStatus.bind(this);

        this.messageBus.subscribe(MessageBusEvents.UserLicenseChanged, this.capabilityChangedHandler.bind(this));

        this.service.CapabilityChanged.on(() => {
            this.hasCapability = !!(Number(localStorage.getItem('capability')) & capability.admin) || !!(Number(localStorage.getItem('capability')) & capability.analisys);
        });

        this.hasCapability = !!(Number(localStorage.getItem('capability')) & capability.admin) || !!(Number(localStorage.getItem('capability')) & capability.analisys);


    }

    capabilityChangedHandler(data: UserLicenseChangedMessage) {
        this.hasCapability = !!(data.license.Permissions & this.capability.admin) || !!(data.license.Permissions & this.capability.analisys);
    }

    fileChoosen(selectedFile: any) {
        this.fileItem = selectedFile;
        this.name = this.fileItem.file.name;
        this.updateReadyStatus();
        this.fileSelected = true;
    }

    updateReadyStatus() {
        let license = this.cache.License;
        let capabilities = (license.Permissions || license.Capabilities);

        this.ready = (this.fileItem != null || !!this.groupId);
        this.hasCapability = !!(capabilities & this.capability.admin) || !!(capabilities & this.capability.analisys);
        this.fileSelected = false;
    }

    runAnalisys() {
      //  if (this.busy == true || this.name.trim() == null || (!!this.groupId && this.groupId.trim() == null && this.fileItem == null)) {
      //      return;
      //  }

     //   this.busy = true;            
        localStorage.setItem('analisys-progress', '0');
        this.inProgress = true;
        if (this.fileItem) {
            this.fileItem.file.name = this.name;
            this.fileItem.url += `&notificationRequired=${this.notificationRequired}`;
            this.fileItem.upload();
        } else {
            console.log('useVKapi');
            console.log(localStorage.getItem('useVKapi'));
            if (localStorage.getItem('useVKapi') === '1') {
                this.service.getGroupMembers(this.groupId, (ids) => {
                    this.service.runAnalisys({
                        groupId: ids,
                        name: this.name,
                        notificationRequired: this.notificationRequired
                    });
                });
            } else {
                 this.service.runAnalisys({
                        groupId: this.groupId,
                        name: this.name,
                        notificationRequired: this.notificationRequired
                    }).then(null, () => this.router.navigateByUrl(`/login`));
            }
        }
        this.inProgress = false;

        this.showModal = true;
        this.name = '';
        this.fileItem = null;
        this.groupId = '';
        setTimeout(() => this.showModal = false, 2000);
        this.updateReadyStatus();
     //   this.router.navigateByUrl(`/busy/${this.type}`);
    }

    getUserIds(callback) {
        window['VK'].api('users.get', { 'user_ids': this.groupId, version: 5.73 }, (data) => callback(data.responce));
    }
}
