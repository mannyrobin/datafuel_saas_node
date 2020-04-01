import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { SocketService } from '../../services/socketService';
import { Router } from '@angular/router';
import { Capability } from '../../helpers/capabilities';
import { QueueItem } from '../../models/queueItem';
import { MessageBus } from '../../messageBus/messageBus';
import { MessageBusEvents } from '../../messageBus/messageBusEvents';
import { MessageType } from '../../dynamicSystemMessage/messageType';
import { ShowDynamicSystemMessageData } from '../../messageBus/showDynamicSystemMessageData';
import { UserLicenseChangedMessage } from '../../messageBus/userLicenseChangedMessage';

import { User } from '../../models/user';
import { Rate } from '../../models/rate';

import { DataFuelCache } from '../../cache/dataFuelCache';

@Component({
    selector: 'user-profile-page',
    templateUrl: './userProfile.page.html',
    styleUrls: ['../analisys.component.css', './userProfile.page.css', '../../../dist/css/pixeladmin-dark.min.css',
        '../../../dist/css/bootstrap.css',
        '../../../dist/css/pixeladmin.css', '../../../dist/css/themes/default.css'],
    providers: [CommonService]
})

export class UserProfilePage implements OnInit {
    private requests: QueueItem[] = [];
    private cancelHandler: any;
    private empty: boolean = null;
    private queueReady: boolean = false;

    private registerPromoHandler: any;
    private applyPromoHandler: any;
    private foreignPromoCode: string;
    private promoRegistered: boolean;
    private promoCode: string;
    private newUser: boolean = true;

    private admin: boolean = false;
    private LicenseModel: Rate = new Rate();

    constructor(private socketService: SocketService,
        private commonService: CommonService,
        private messageBus: MessageBus,
        private capability: Capability,
        private cache: DataFuelCache) {
        messageBus.subscribe(MessageBusEvents.UserReceived, this.userReceived_messageBusHandler.bind(this));
        messageBus.subscribe(MessageBusEvents.UserLicenseChanged, this.userLicenseChanged_messageBusHandler.bind(this));
        socketService.on('updateProgress', this.updateProgressStatus.bind(this));
        socketService.getQueue();

        this.cancelHandler = this.cancelRequest.bind(this);
        this.registerPromoHandler = this.registerPromoCode.bind(this);
        this.applyPromoHandler = this.applyPromo.bind(this);

        let user = cache.CurrentUser;
        if (user != null) {
            this.userReceived_messageBusHandler(user);
        } else {
            this.commonService.getUser().then(user => this.messageBus.perform(MessageBusEvents.UserReceived, user))
        }
    }

    ngOnInit() {
        this.socketService.on('queueResult', this.initialize.bind(this));
        if (this.cache.License) {
            this.LicenseModel = this.cache.License;
            this.newUser = this.cache.License.Permissions < 10 || this.admin;
        }
    }

    userLicenseChanged_messageBusHandler(data: UserLicenseChangedMessage) {
        this.LicenseModel = data.license;
        this.newUser = data.license.Permissions < 10 || this.admin;
    }

    userReceived_messageBusHandler(user: User) {
        this.promoCode = user.Promo;
        this.promoRegistered = user.Promo != null;
        this.admin = (user.Capability & 1) > 0;
        this.newUser = user.Capability < 10 || this.admin;
    }

    updateProgressStatus(data) {
        if (this.empty) {
            return;
        }

        let request = this.requests.find(item => item.Id == data.resultId)
        if (request != null) {
            request.Progress = data.progress;
        } else {
            this.requests.push(new QueueItem(data.resultName, data.resultId, data.progress, new Date()));
        }
    }

    applyPromo() {
        this.commonService.applyPromoCode(this.foreignPromoCode).then(res => {
            this.messageBus.perform(MessageBusEvents.ShowDynamicSystemMessage, new ShowDynamicSystemMessageData(res.success ? MessageType.success : MessageType.error, res.message));

            let capabilities = res.license.Capabilities || res.license.Permissions;
            if (res.success && this.cache.License.Capabilities < capabilities) {
                this.newUser = this.admin;
                this.messageBus.perform(MessageBusEvents.UserLicenseChanged, new UserLicenseChangedMessage(res.license));
            } else {
                try {
                    this.cache.License.TotalRequestLimit = Number(this.cache.License.TotalRequestLimit) + parseInt(res.license.TotalRequestLimit);
                } catch (e) {

                }
                try {
                    this.cache.License.ExportLimit = parseInt(this.cache.License.ExportLimit) + parseInt(res.license.ExportLimit) + '';
                } catch (e) {

                }
                this.messageBus.perform(MessageBusEvents.UserLicenseChanged, new UserLicenseChangedMessage(this.cache.License));
            }

            location.reload();
        });
    }

    registerPromoCode() {
        if (this.promoCode.trim() == '') {
            return;
        }

        this.commonService.registerPromoCode(this.promoCode).then(res => {
            this.promoRegistered = res.success;
            this.cache.CurrentUser.Promo = this.promoCode;
            this.messageBus.perform(MessageBusEvents.ShowDynamicSystemMessage, new ShowDynamicSystemMessageData(this.promoRegistered ? MessageType.success : MessageType.error, res.message));
        });
    }

    cancelRequest(requestId: number) {
        this.commonService.cancelRequest(requestId);
        this.requests = this.requests.filter(r => r.Id != requestId);
    }

    initialize(data) {
        this.requests = data;
        this.queueReady = true;
        this.empty = this.requests.length == 0;
    }

    getDateString(dateTime) {
        return (new Date(dateTime)).toLocaleString();
    }

    restDays(dateTime) {
        let date1 = new Date(),
            date2 = new Date(dateTime)
        var timeDiff = Math.abs(date2.getTime() - date1.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays;
    }

    getAccess() {
        let description = ``;

        if (!this.LicenseModel) {
            return description;
        }

        if (this.LicenseModel.Capabilities & this.capability.analisys) {
            description += 'анализ';
        }

        if (this.LicenseModel.Capabilities & this.capability.lal) {
            description += ', поиск похожих';
        }

        if (this.LicenseModel.Capabilities & this.capability.admin) {
            description = 'поздравляю, у вас Админка (:';
        }

        return description;
    }
}