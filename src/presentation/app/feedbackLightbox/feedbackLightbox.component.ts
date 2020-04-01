import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';
import { FileSelectDirective, FileDropDirective, FileUploader } from 'ng2-file-upload/ng2-file-upload';
import { Lightbox } from '../../lightbox/lightbox';
import {NgClass} from '@angular/common';

const API_URL = window.location.protocol + '//' + window.location.host + '/upload';

@Component({
    selector: 'feedback-lightbox',
    templateUrl: './feedbackLightbox.component.html',
    styleUrls: ['../app.css', './feedbackLightbox.component.css'],
    providers: [CommonService]
})

export class FeedbackLightbox {
    @Output() public feedbackSent = new EventEmitter();

    public childShowButtonTitle: string = 'обратная связь';
    public comment: string;

    private proceedHandler: any;

    constructor(
        private service: CommonService,
        private router: Router) {
        this.proceedHandler = this.proceed.bind(this);
    }

    public proceed() {
        if (this.comment == null || this.comment == '') {
            return;
        }

        this.feedbackSent.emit(this.comment);
        this.comment = '';
    }

    public handleClosed() {

    }
}
