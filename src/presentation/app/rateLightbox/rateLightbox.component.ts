import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';
import { Lightbox } from '../../lightbox/lightbox';
import { NgClass } from '@angular/common';

import { Rate } from '../../models/rate';

import { MessageBus } from '../../messageBus/messageBus';
import { MessageBusEvents } from '../../messageBus/messageBusEvents';
import { MessageType } from '../../dynamicSystemMessage/messageType';
import { ShowDynamicSystemMessageData } from '../../messageBus/showDynamicSystemMessageData';
import { UserLicenseChangedMessage } from '../../messageBus/userLicenseChangedMessage';

@Component({
    selector: 'rate-lightbox',
    templateUrl: './rateLightbox.component.html',
    styleUrls: ['./rateLightbox.component.css', '../app.css'],
})

export class RateLightbox {
    private proceedHandler: any;
    private canceledHandler: any;
    private rateChangedHandler: any;
    private periodChangedHandler: any;
    private changeTypeHandler: any;

    private rates: Rate[];
    private filteredRates: Rate[];
    private period: number = 30;
    private corp: boolean = true;

    @Input() public selectedRate: string;

    constructor(
        private service: CommonService,
        private router: Router,
        private messageBus: MessageBus) {
        this.proceedHandler = this.proceed.bind(this);
        this.rateChangedHandler = this.rateChanged.bind(this);
        this.periodChangedHandler = this.periodChanged.bind(this);
        this.changeTypeHandler = this.changeType.bind(this);

        service.getRates(false).then(this.rateListRecieved.bind(this));
    }

    public proceed() {
        localStorage.setItem('capability', '');
        localStorage.setItem('money', '');
        localStorage.setItem('exportLimit', '');
        localStorage.setItem('requests', '');
        this.service.selectRate(this.selectedRate).then((data) => {
            data.Capabilities && localStorage.setItem('capability', data.Capabilities);
            data.Money && localStorage.setItem('money', data.Money);
            data.ExportLimit && localStorage.setItem('exportLimit', data.ExportLimit);
            data.Requests && localStorage.setItem('requests', data.Requests);

            CommonService.capabilityChanged.trigger();

            if (data.message) {
                this.messageBus.perform(MessageBusEvents.UserLicenseChanged, new UserLicenseChangedMessage(data));

                this.messageBus.perform(MessageBusEvents.ShowDynamicSystemMessage, new ShowDynamicSystemMessageData(data.success ? MessageType.success : MessageType.error, data.message));
                var mailNotification = new window['Notification']("Data Fuel", {
                    tag: "",
                    body: `${data.message}`,
                    icon: `${window.location.protocol}//${window.location.host}/notificationIcon`,
                });
            }
        });
    }

    public changeType() {
        this.corp = !this.corp;
        this.filteredRates = this.rates.filter(r => r.Limitation == this.period && ((r.GroupSize == 1) == this.corp) && r.Cost != '$0.00');
    }

    public handleClosed() {

    }

    public disableOption(index, corp) {
        return !corp && index > 0;
    }

    private rateChanged(rateId, event: Event, index) {
        if (!this.corp && index > 0) {
            return;
        }

        this.selectedRate = rateId;
        event.stopPropagation();
    }

    public getLookAlikeTitle(capabilities : number) {
        return (capabilities & 64) > 0 
            ? 'подключен'
            : 'нет';
    }

    private periodChanged(event) {
        this.filteredRates = this.rates.filter(r => r.Limitation == event.target['value'] && ((r.GroupSize == 1) == this.corp) && r.Cost != '$0.00');
    }

    private rateListRecieved(ratesJson: any) {
        this.rates = ratesJson.json();
        this.filteredRates = this.rates.filter(r => r.Limitation == this.period && ((r.GroupSize == 1) == this.corp) && r.Cost != '$0.00');
        this.messageBus.perform(MessageBusEvents.RatesReceived, this.rates);
    }
}
