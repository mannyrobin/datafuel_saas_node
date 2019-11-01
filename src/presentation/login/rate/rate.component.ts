import { Component } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';

import { DataFuelCache } from '../../cache/dataFuelCache';
import { Rate } from '../../models/rate';

import { MessageBus } from '../../messageBus/messageBus';
import { MessageBusEvents } from '../../messageBus/messageBusEvents';
import { MessageType } from '../../dynamicSystemMessage/messageType';

@Component({
    selector: 'rate',
    templateUrl: './rate.component.html',
    styleUrls: ['./rate.component.css'],
    providers: [CommonService]
})

export class RateComponent {
    private rates: Rate[];

    constructor(
        private service: CommonService,
        private router: Router,
        private cache: DataFuelCache,
        private messageBus: MessageBus) {
            service.getRates().then(this.rateListRecieved.bind(this));
    }

    rateListRecieved(data) {
        this.rates = data.json();
        this.messageBus.perform(MessageBusEvents.RatesReceived, this.rates);
    }
}

