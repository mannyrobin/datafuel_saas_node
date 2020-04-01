import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';
import { FileSelectDirective, FileDropDirective, FileUploader } from 'ng2-file-upload/ng2-file-upload';
import { Lightbox } from '../../lightbox/lightbox';
import { NgClass } from '@angular/common';

const API_URL = window.location.protocol + '//' + window.location.host + '/upload';

@Component({
    selector: 'attach-file-lightbox',
    templateUrl: './attachFileLightbox.component.html',
    styleUrls: ['./attachFileLightbox.component.css'],
    providers: [CommonService]
})

export class AttachFileLightbox {
    @Input() public type: string;
    @Input() public guid: string;
    @Input() public childShowButtonTitle: string = 'загрузите список Id';
    @Output() public fileUploaded = new EventEmitter();
    @Output() public fileLoaded = new EventEmitter();

    public uploader: FileUploader = new FileUploader({ url: `${API_URL}` });
    public hasBaseDropZoneOver: boolean = false;
    public hasAnotherDropZoneOver: boolean = false;

    private proceedHandler: any;

    constructor(
        private service: CommonService,
        private router: Router) {
        this.proceedHandler = this.proceed.bind(this);
        this.uploader.clearQueue();
        
        this.uploader.onCompleteItem = (item:any, response:any, status:any, headers:any) => {
            console.log("ImageUpload:uploaded:", item, status);
            var res = JSON.parse(response);

            this.fileLoaded.emit(res);
        };
    }

    public fileOverBase(e: any): void {
        this.hasBaseDropZoneOver = e;
    }

    public fileOverAnother(e: any): void {
        this.hasAnotherDropZoneOver = e;
    }

    public proceed() {
        if (this.uploader.queue.length == 0) {
            return;
        }

        var fileItem = this.uploader.queue[this.uploader.queue.length - 1];
        fileItem.url = `${API_URL}?type=${this.type}`;

        if (this.guid) {
            fileItem.url += `&guid=${this.guid}`;

        }

        this.fileUploaded.emit(fileItem);
    }

    public handleClosed() {

    }
}
