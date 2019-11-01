import { Component, ViewChild } from '@angular/core';
import { CommonService } from '../services/commonService';
import { Router } from '@angular/router';
import { Lightbox } from '../lightbox/lightbox';
import { Capability } from '../helpers/capabilities';
import { User } from '../models/user';
import { MessageBus } from '../messageBus/messageBus';
import { MessageBusEvents } from '../messageBus/messageBusEvents';
import { ShowDynamicSystemMessageData } from '../messageBus/showDynamicSystemMessageData';
import { Rate } from '../models/rate';
import { UserLicenseChangedMessage } from '../messageBus/userLicenseChangedMessage';
import { MessageType } from '../dynamicSystemMessage/messageType';
import { DataFuelCache } from '../cache/dataFuelCache';

@Component({
    selector: 'master-page',
    templateUrl: './master.page.html',
    styleUrls: ['./master.page.css', '../app/app.css', '../../dist/css/pixeladmin-dark.min.css',
        '../../dist/css/bootstrap.css',
        '../../dist/css/pixeladmin.css', '../../dist/css/themes/default.css'],
    providers: [CommonService]
})

export class MasterPage {
    private selectedTab: string = 'Анализ';
    private userEmail: string;
    private userPhoto: string = null;
    private proceedHandler: any;
    private emailValid: boolean = true;

    private balance: string = '0';
    private requests: string = '0';
    private exportLimit: string;
    private requestsLimit: string;

    public hasAdminCapability: boolean;
    private hasLaLCapability: boolean = false;
    private hasSearchByPhoneCapability: boolean = false;

    private showDynamicSystemMessageHandler: any;
    private showSystemMessage: boolean = false;
    private systemMessageType: string;
    private message: string;
    private promo: string;
    private newUser: boolean = false;

    //@ViewChild(Lightbox)

    constructor(
        private service: CommonService,
        private router: Router,
        private capabilities: Capability,
        private messageBus: MessageBus,
        private cache: DataFuelCache) {

        this.showDynamicSystemMessageHandler = this.showDynamicSystemMessage.bind(this);
        this.messageBus.subscribe(MessageBusEvents.ShowDynamicSystemMessage, this.showDynamicSystemMessageHandler);
        this.messageBus.subscribe(MessageBusEvents.UserLicenseChanged, this.capabilityChangedHandler.bind(this));

        this.userPhoto = localStorage.getItem("photo_100");

        this.service.LoggedIn.on((capability: number) => {
            this.updateCapability(capability);
            this.setUserAvatar();
        });

        this.service.CapabilityChanged.on(() => {
            this.balance = localStorage.getItem('money') || this.balance;

            let newExportLimit = localStorage.getItem('exportLimit');
            this.requests = this.cache.CurrentUser.Requests.toString();

            var permissions = localStorage.getItem('capability');

            if (permissions && parseInt(permissions)) {
                this.updateCapability(parseInt(permissions));
            }

            if (newExportLimit == '' && localStorage.getItem('requests') != '') {
                this.exportLimit = null;
            } else {
                this.exportLimit = localStorage.getItem('exportLimit') || this.exportLimit;
            }
        });

        this.initializeTab();

        this.service.getUser().then((user: User) => {
            this.messageBus.perform(MessageBusEvents.UserReceived, user);

            this.balance = (user.Money || '').toString();
            this.requests = (user.Requests || '').toString();

            if (user.Capability != null) {
                this.updateCapability(user.Capability);
                this.newUser = user.Capability == 4;

                this.exportLimit = user.ExportLimit == null ? 'не ограничен' : (user.ExportLimit || '').toString();
                this.requestsLimit = (user.TotalRequestLimit || '').toString();
            }
        });

        this.proceedHandler = this.updateEmail.bind(this);
        this.setUserAvatar();

        var permissions = localStorage.getItem('capability');

        if (permissions && parseInt(permissions)) {
            this.updateCapability(parseInt(permissions));
        }
    }

    private capabilityChangedHandler(data: UserLicenseChangedMessage) {
        let newExportLimit = (data.license.ExportLimit || '').toString();
        this.requests = (data.license.Request || data.license['request'] || '').toString();
        this.requestsLimit = (data.license.TotalRequestLimit || '').toString();

        var permissions = data.license.Permissions;

        if (permissions && permissions) {
            this.updateCapability(permissions);
        }

        if (newExportLimit == '' && data.license.Request > 0) {
            this.exportLimit = null;
        } else {
            this.exportLimit = data.license.ExportLimit;
        }
    }

    private showDynamicSystemMessage(data: ShowDynamicSystemMessageData) {
        this.message = data.message;
        this.showSystemMessage = true;
        this.systemMessageType = data.type;

        setTimeout(() => this.showSystemMessage = data.permanent, 3000);
    }

    updateCapability(capability: number) {
        this.hasAdminCapability = this.hasCapabilities(this.capabilities.admin, capability);
        this.hasLaLCapability = this.hasCapabilities(this.capabilities.lal, capability) || this.hasAdminCapability;
        this.hasSearchByPhoneCapability = this.hasCapabilities(this.capabilities.searchByPhone, capability) || this.hasAdminCapability;
    }

    hasCapabilities(required: number, capability: number): boolean {
        return (required & capability) > 0;
    }

    getName() {
        return localStorage.getItem("firstName") + ' ' + localStorage.getItem("lastName");
    }

    setUserAvatar() {
        if (!window['DEV']) {
            if (!window['DEV'] && window['VK'] != null) {
                if (window['VK']._appId == null) {
                    window['VK'].init({
                        apiId: 5962277,
                        version: 5.73
                    });
                }
            }
            window['VK'].api('users.get', {
                fields: 'photo_100', 
                version: 5.73
            }, data => {
                if (data['response'].length > 0) {
                    this.userPhoto = data['response'][0]['photo_100'];
                    localStorage.setItem("photo_100", this.userPhoto);
                }
            });
        } else {
            this.userPhoto = "https://pp.vk.me/c625225/v625225070/3de2a/hkHWdKREMwE.jpg";
        }
    }


    initializeTab() {
        var page = window.location.toString().split('/')[3];

        switch (page) {
            case 'analisys':
                this.selectedTab = 'Анализ';
                return;
            case 'segment':
                this.selectedTab = 'Сегментация';
                return;
            case 'results':
                this.selectedTab = 'Результаты';
                return;
            case 'searchByPhone':
                this.selectedTab = 'Обогащение';
                return;
        }
    }

    validateEmail() {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(this.userEmail);
    }

    updateEmail(event) {
        this.emailValid = this.validateEmail();
        if (this.emailValid) {
            this.service.updateUserEmail(this.userEmail);
        } else {
            event.preventDefault();
        }

        if (this.promo.trim() != '') {
            this.service.applyPromoCode(this.promo).then(res => {
                this.messageBus.perform(MessageBusEvents.ShowDynamicSystemMessage, new ShowDynamicSystemMessageData(res.success ? MessageType.success : MessageType.error, res.message));

                if (res.success) {
                    this.messageBus.perform(MessageBusEvents.UserLicenseChanged, new UserLicenseChangedMessage(res.license));
                }
            });
        }
    }

    changeSelectedTab(name: string, event) {
        this.selectedTab = name;
    }

    clickHandler() {
        this.service.logout().then(() => this.router.navigateByUrl('/login'));
    }
}
