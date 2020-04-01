import { Injectable } from '@angular/core';

import { User } from '../models/user';
import { Rate } from '../models/rate';
import { MessageBus } from '../messageBus/messageBus';
import { MessageBusEvents } from '../messageBus/messageBusEvents';
import { UserLicenseChangedMessage } from '../messageBus/userLicenseChangedMessage';

import { CommonService } from '../services/commonService';

@Injectable()
export class DataFuelCache {
    public CurrentUser: User;
    public License: Rate;
    public Rates: Rate[] = [];

    constructor(private messageBus: MessageBus, private service: CommonService) {
        if (this.License == null) {
            this.service.getUserRate().then(license => this.License = license);
        }

        if (this.CurrentUser == null) {
            this.service.getUser().then((user: User) => this.CurrentUser = user);
        }

        this.messageBus.subscribe(MessageBusEvents.UserReceived, (user: User) => this.CurrentUser = user);
        this.messageBus.subscribe(MessageBusEvents.UserLicenseChanged, (data: UserLicenseChangedMessage) => {
            this.License = data.license;

            if (this.CurrentUser) {
                this.CurrentUser.ExportLimit = Number(data.license.ExportLimit) || null;
                this.CurrentUser.Requests = data.license.Request;
                this.CurrentUser.TotalRequestLimit = data.license.TotalRequestLimit;
                this.CurrentUser.Capability = data.license.Permissions || data.license.Capabilities;
            }
        });

        this.messageBus.subscribe(MessageBusEvents.RatesReceived, (rates: Rate[]) => this.Rates = rates);
    }
}
