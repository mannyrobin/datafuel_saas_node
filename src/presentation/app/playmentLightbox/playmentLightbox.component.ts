import { Component, EventEmitter, Output, Input, ViewChild } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';
import { Lightbox } from '../../lightbox/lightbox';
import { NgClass } from '@angular/common';
import { Http, Headers } from '@angular/http';

import { Rate } from '../../models/rate';

const API_URL = window.location.protocol + '//' + window.location.host + '/upload';

@Component({
    selector: 'playment-lightbox',
    templateUrl: './playmentLightbox.component.html',
    styleUrls: ['../app.css'],
    providers: [CommonService]
})

export class PlaymentLightbox {
    @Output() public balanceUpdated = new EventEmitter();
    @Input() private userId: number;

    @ViewChild(Lightbox)
    private popup: Lightbox; 

    public childShowButtonTitle: string = 'оплатить';
    public comment: string;

    private proceedHandler: any;
    private canceledHandler: any;
    private editOrderHandler: any;
    private payHandler: any;

    private billReady: boolean = false;
    private billInfo: Rate[] = [];

    private sum: number;
    
    private errorMessage: string = 'введите сумму большую 0';
    private hasError: boolean = false;

    constructor(
        private service: CommonService,
        private router: Router,
        private http: Http) {
        this.proceedHandler = this.close.bind(this);
        this.canceledHandler = this.cancel.bind(this);

        this.payHandler = this.pay.bind(this);

        this.billReady = false;
    }

    private pay(event: Event) {
        this.hasError = this.sum <= 0;
        this.popup.hasError = this.hasError;

        if (this.hasError) {
            event.stopImmediatePropagation();
            event.preventDefault();
            return;
        }

     /*   this.service.playment(this.sum).then(function () {
            console.log(arguments);
        }, function () {
            console.log(arguments);
        });*/

        this.service.addMoney(this.sum).then((data) => {
            this.balanceUpdated.emit(data.balance);
        });

        this.sum = null;
    }

    public close() {
        this.popup.close();
    }

    public proceed() {
    }

    public cancel() {
        /*  this.billReady = false;
  
          for(let i = 0; i < this.billInfo.length; i++) {
              this.billInfo[i].Count = 0;
          }
          
          this.billInfo = [];*/
    }
}
