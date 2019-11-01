import { Injectable } from '@angular/core';

const API_URL = `${window.location.protocol}//${window.location.host}`;

@Injectable()
export class MessageBus {
    private handlers: any = {};

    constructor() {
    }

    public subscribe(event, callback) {
        if (this.handlers[event] == null) {
            this.handlers[event] = [];
        }

        this.handlers[event].push(callback);
    }

    public perform(event, data) {
        if (this.handlers[event] == null) {
            console.log(`no such event exist`);
            return;
        }

        this.handlers[event].forEach(h => h(data));
    }
}