import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { LiteEvent, ILiteEvent } from '../LiteEvent/LiteEvent';
import { ExportResultModel } from '../models/exportResultModel';
import { CommonService } from './commonService';

const API_URL = `${window.location.protocol}//${window.location.host}`;

@Injectable()
export class SocketService {
    static ws: WebSocket;
    static handlers: any = {};

    constructor(private commonService: CommonService) {
        window['DEV'] = window.location.hostname == 'localhost';

        commonService.LoggedIn.on(this.initializeWebSocket.bind(this));

        commonService.LoggingOut.on(() => {
            SocketService.ws.close();
        });

        window.addEventListener("beforeunload", event => {
            SocketService.ws.close();
        });

        if (localStorage.getItem('loggedIn') !== '0') {
            if (window.location.pathname.indexOf('login') < 0) {
                this.initializeWebSocket();
            }
        }
    }

    initializeWebSocket() {
        if (SocketService.ws != null && SocketService.ws.readyState == 1) {
            return;
        }

        const secure = window.location.protocol.indexOf('s') > 0;
        SocketService.ws = !!window['DEV'] ? new WebSocket(`ws${secure ? 's' : ''}://localhost${!secure ? ':' + window.location.port : ''}`) : new WebSocket(`ws${secure ? 's' : ''}://vk.datafuel.ru`);

        SocketService.ws.onmessage = (evt) => {
            const message = JSON.parse(evt.data);

            if (this[message.type] != null) {
                this[message.type](evt);
            }

            if (SocketService.handlers[message.type] != null) {
                SocketService.handlers[message.type](JSON.parse(message.text));
            }
        };
    }

    browserNotification(evt) {
        const message = JSON.parse(evt.data);
        var mailNotification = new window['Notification']("Data Fuel", {
            tag: "результат",
            body: `${message.text} \n нажмите сюда для перехода к результату`,
            icon: `${window.location.protocol}//${window.location.host}/notificationIcon`,
        });


        mailNotification.onclick = function () {
            window.open(`${window.location.protocol}//${window.location.host}/results/${message.resultId}`);
        };
    }

    public getQueue() {
        this.sendMessage({ type: 'getQueue' });
    }

    public sendMessage(data) {
        if (SocketService.ws.readyState != 1) {
            setTimeout(this.sendMessage.bind(this, data), 100);
            if (SocketService.ws.readyState > 1) {
                this.initializeWebSocket();
            }
            return;
        }

        SocketService.ws.send(JSON.stringify(data));
    }

    public on(type, handler) {
        SocketService.handlers[type] = handler;
    }
}