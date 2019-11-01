import { Component } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';

import { AttachFileLightbox } from '../attachFileLightbox/attachFileLightbox.component';
import { RequestType } from '../../helpers/requestType';
import { Capability } from '../../helpers/capabilities';
import { Rate } from '../../models/rate';
import { MessageType } from '../../dynamicSystemMessage/messageType';
import { ShowDynamicSystemMessageData } from '../../messageBus/showDynamicSystemMessageData';
import { UserLicenseChangedMessage } from '../../messageBus/userLicenseChangedMessage';
import { MessageBus } from '../../messageBus/messageBus';
import { MessageBusEvents } from '../../messageBus/messageBusEvents';
import { DataFuelCache } from '../../cache/dataFuelCache';

@Component({
    selector: 'analisys-page',
    templateUrl: './searchByPhone.page.html',
    styleUrls: ['./searchByPhone.page.css', '../analisys.component.css', '../../app/app.css', '../../../dist/css/pixeladmin-dark.min.css',
    '../../../dist/css/bootstrap.css', '../../../dist/css/pixeladmin.css', '../../../dist/css/themes/default.css'],
    providers: [CommonService]
})

export class SearchByPhonePage {
    public name: string;
    public fileItem: any;
    public phones: string;
    public type: string = RequestType.phone;
    
    private uploadFileButtonTitle: string = 'загрузите ТХТ файл';
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

    private hash: string = 'none';
    private fileId: number = 0;

    constructor(
        private service: CommonService,
        private router: Router,
        private capability: Capability,
        private messageBus: MessageBus,
        private cache: DataFuelCache) {

        this.fileChoosenHandler = this.fileChoosen.bind(this);
        this.runAnalisysHandler = this.runSearchByPhone.bind(this);
        this.onModelChangedHandler = this.updateReadyStatus.bind(this);

        this.messageBus.subscribe(MessageBusEvents.UserLicenseChanged, this.capabilityChangedHandler.bind(this));

        this.service.CapabilityChanged.on(() => {
            this.hasCapability = !!(Number(localStorage.getItem('capability')) & capability.admin) || !!(Number(localStorage.getItem('capability')) & capability.searchByPhone);
        });

        this.hasCapability = !!(Number(localStorage.getItem('capability')) & capability.admin) || !!(Number(localStorage.getItem('capability')) & capability.searchByPhone);
    }

    capabilityChangedHandler(data: UserLicenseChangedMessage) {
        this.hasCapability = !!(data.license.Permissions & this.capability.admin) || !!(data.license.Permissions & this.capability.searchByPhone);
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

        this.ready = (this.fileItem != null || this.phones.length > 0);
        this.hasCapability = !!(capabilities & this.capability.admin) || !!(capabilities & this.capability.searchByPhone);
        this.fileSelected = false;
    }

    fileLoaded(event) {
        if (event.message) {
            //error
            return;
        }

        this.service.searchUsersByPhones({phones: null, fileId: event.result, hash: this.hash, name: this.name, resultId: null});
        this.reset();
    }

    runSearchByPhone() {   
        this.showModal = true;    
        localStorage.setItem('analisys-progress', '0');
        this.inProgress = true;
        if (this.fileItem) {
            this.fileItem.file.name = this.name;
            this.fileItem.url += `&notificationRequired=${this.notificationRequired}`;
            this.fileItem.upload();
        } else {
            console.log('useVKapi');
            console.log(localStorage.getItem('useVKapi'));
            this.service.searchUsersByPhones({phones: this.phones.split('\n'), fileId: null, hash: this.hash, name: this.name, resultId: null});
            this.reset();
        }

        setTimeout(()=> this.showModal = false, 2000);
    }

    reset() {
        this.name = '';
        this.fileItem = null;
        this.inProgress = false;
        this.phones = '';
        this.fileSelected = false;
    }
}
