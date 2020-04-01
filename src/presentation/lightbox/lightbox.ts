import { Component, Input, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'lightbox',
    templateUrl: './lightbox.html',
    styleUrls: ['./lightbox.css', '../app/app.css']
})

export class Lightbox {
    public visible: boolean = false;
    public handleProceed: any;
    public handleClosed: any;

    public hasError: boolean = false;
    
     @Input() showButtonTitle: string;
     @Input() containerClass: string;
     @Input() displayLightboxButton: string;
     @Input() hideFooter: boolean = false;

     @Output() proceeded = new EventEmitter();
     @Output() canceled = new EventEmitter();

    constructor() {
        this.handleProceed = this.proceed.bind(this);
        this.handleClosed = this.closed.bind(this);
    }

    public show() {
        this.visible = true;
    }

    private proceed(event) {
        this.proceeded.emit(event);
        this.visible = this.hasError;
    }

    public close() {
        this.visible = false;
    }

    private closed() {
        this.visible = false;
        this.canceled.emit();
    }
}
