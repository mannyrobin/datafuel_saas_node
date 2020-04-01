import { Component, ViewChild } from '@angular/core';
import { CommonService } from '../services/commonService';
import { SocketService } from '../services/socketService';
import { Router } from '@angular/router';
import { FeedbackLightbox } from './feedbackLightbox/FeedbackLightbox.component';
import { RateLightbox } from './rateLightbox/rateLightbox.component';
import { User } from '../models/user';
import { PlaymentLightbox } from './playmentLightbox/playmentLightbox.component';
import { Capability } from '../helpers/capabilities';

import { MessageType } from '../dynamicSystemMessage/messageType';
import { ShowDynamicSystemMessageData } from '../messageBus/showDynamicSystemMessageData';
import { UserLicenseChangedMessage } from '../messageBus/userLicenseChangedMessage';
import { MessageBus } from '../messageBus/messageBus';
import { MessageBusEvents } from '../messageBus/messageBusEvents';

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css', './app.css', '../../dist/css/pixeladmin-dark.min.css',
        '../../dist/css/bootstrap.css',
        '../../dist/css/pixeladmin.css', '../../dist/css/themes/default.css'],
    providers: [CommonService],
})

export class AppComponent {
    //@ViewChild(PlaymentLightbox)
    //private playmentLightbox: PlaymentLightbox;

    private navigationMenuHidden: boolean;
    private logoutHandler: any;
    private hideNavigationPanel: boolean;
    private userPhoto: string = '//:0';

    private showUserMenuHandler: any;
    private userMenuHidden: boolean = true;
    private payHandler: any;
    private hideUserMenuHandler: any;
    private balanceUpdatedHandler: any;

    private sendFeedbackHandler: any;

    private selectedRate: string;
    private balance: string = '0.0';
    private requests: number = 0;
    private userId: number = 10;
    public hasAdminCapability: boolean;

    constructor(
        private service: CommonService,
        private router: Router,
        private socketService: SocketService,
        private cap: Capability,
        private messageBus: MessageBus) {

        this.userPhoto = localStorage.getItem("photo_100");

        window['DEV'] = window.location.hostname == 'localhost';
        window['Notification'].requestPermission();

        this.showUserMenuHandler = this.showUserMenu.bind(this);
        this.payHandler = this.pay.bind(this);
        this.hideUserMenuHandler = this.hideUserMenu.bind(this);
        this.sendFeedbackHandler = this.sendFeedback.bind(this);
        this.balanceUpdatedHandler = this.balanceUpdated.bind(this);

        this.navigationMenuHidden = location.toString().indexOf('login') > -1;

        this.logoutHandler = this.logout.bind(this);

        this.service.CapabilityChanged.on(() => {
            this.balance = localStorage.getItem('money') || this.balance;
        });
        this.service.LoggedIn.on((capability: number) => {
            this.navigationMenuHidden = false;
            this.setUserAvatar();
            this.hasAdminCapability = (cap.admin & capability) > 0;

            this.service.getUserRate().then((rate) => {
                if (rate != null) {
                    this.selectedRate = '' + rate.Id;
                    this.messageBus.perform(MessageBusEvents.UserLicenseChanged, new UserLicenseChangedMessage(rate));
                } else {
                    this.messageBus.perform(MessageBusEvents.ShowDynamicSystemMessage, new ShowDynamicSystemMessageData(MessageType.error, 'ваша лицензия закончилась', true));
                }
            });

            this.service.getUser().then((user: User) => {
                this.balance = (user.Money || '').toString();
                this.requests = user.Requests;
                this.userId = user.Id;

                localStorage.setItem('capability', (user.Capability || 0).toString());
                if (user.AccountId != null) {
                    localStorage.setItem('accountId', user.AccountId.toString());
                }
            });
        });

        if (localStorage.getItem('loggedIn') !== '0') {
            this.service.getUserRate().then((rate) => {
                if (rate != null) {
                    this.selectedRate = '' + rate.Id;
                    this.messageBus.perform(MessageBusEvents.UserLicenseChanged, new UserLicenseChangedMessage(rate));
                } else {
                    this.messageBus.perform(MessageBusEvents.ShowDynamicSystemMessage, new ShowDynamicSystemMessageData(MessageType.error, 'ваша лицензия закончилась', true));
                }
            });

            this.service.getUser().then((user: User) => {
                this.hasAdminCapability = (cap.admin & user.Capability) > 0;
                this.balance = user.Money.toString();
                this.requests = user.Requests;
                this.userId = user.Id;
                localStorage.setItem('capability', (user.Capability || 0).toString());
            });
        }

        if (!window['DEV']) {
            window['VK'].init({
                apiId: 5962277, 
                version: 5.73
            });
        }

        this.setUserAvatar();
    }

    balanceUpdated(money) {
        this.balance = money;
    }

    pay() {

    }

    sendFeedback(text) {
        this.service.sendFeedback(text);
    }

    showUserMenu(event) {
        if (event.target.type != 'submit') {
            this.userMenuHidden = false;
            event.stopPropagation();
            event.preventDefault();
            return false;
        }

        this.userMenuHidden = true;
        //this.playmentLightbox.close();
    }

    hideUserMenu() {
        this.userMenuHidden = true;
    }

    setUserAvatar() {
        if (!window['DEV']) {
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

    getName() {
        return localStorage.getItem("firstName") + ' ' + localStorage.getItem("lastName");
    }

    logout() {
        //  window['VK'].Auth.logout();
        this.navigationMenuHidden = true;
        this.service.logout().then(() => this.router.navigateByUrl('/login'));
        localStorage.setItem('loggedIn', '0');
    }

    navigateToPaywall() {
        window.open("https://datafuel.ru/paywall?utm_source=paywall&utm_medium=saas&utm_campaign={campaign_id}&utm_content={ad_id}&utm_term={keyword}","_blank");
    }
}
