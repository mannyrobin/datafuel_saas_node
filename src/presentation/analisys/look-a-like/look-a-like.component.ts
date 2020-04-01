import { Component } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';
import { RequestType } from '../../helpers/requestType';
import { Capability } from '../../helpers/capabilities';
import { Guid } from '../../helpers/guid';
import { FileUploader } from 'ng2-file-upload/ng2-file-upload';

@Component({
    selector: 'look-a-like-page',
    templateUrl: './look-a-like.component.html',
    styleUrls: ['../analisys.component.css', './component.css', '../../app/app.css', '../../../dist/css/pixeladmin-dark.min.css',
        '../../../dist/css/bootstrap.css',
        '../../../dist/css/pixeladmin.css', '../../../dist/css/themes/default.css'],
})

export class LookALikePage {
    public name: string;
    public sourceFileItem: any;
    public targetFileItem: any;
    public sourceGroupId: string;
    public targetGroupId: string;
    public sourceGroupFile: string = 'sourceGroupFile';
    public targetGroupFile: string = 'targetGroupFile';
    private expectedCount: Number = 10000;
    private sex: string = '0';
    private guid: string = Guid.New();

    private fileChoosenHandler: any;
    private runSegmentationHandler: any;
    private fileUploader: any;
    private showModal: boolean = false;
    private inProgress: boolean = false;

    private hasCapability: boolean;

    public ready: boolean = false;

    private onModelChangedHandler: any;

    constructor(
        private service: CommonService,
        private router: Router,
        private capability: Capability) {
        this.fileChoosenHandler = this.fileChoosen.bind(this);
        this.runSegmentationHandler = this.runSegmentation.bind(this);
        this.hasCapability = !!(Number(localStorage.getItem('capability')) & capability.admin) || !!(Number(localStorage.getItem('capability')) & capability.segment);

        this.onModelChangedHandler = this.onModelChanged.bind(this);
    }

    fileChoosen(selectedFile: any, type: string) {

        switch (type) {
            case 'sourceGroupFile':
                this.sourceFileItem = selectedFile;
                this.name = this.name || this.sourceFileItem.file.name;
                this.sourceGroupId = this.sourceFileItem.file.name;
                break;
            case 'targetGroupFile':
                this.targetFileItem = selectedFile;
                this.targetGroupId = this.targetFileItem.file.name;
                break;
        }

        this.updateReadyStatus();
    }

    updateReadyStatus() {
        this.ready = (this.sourceFileItem != null || !!this.sourceGroupId)
            && (this.targetFileItem != null || !!this.targetGroupId);
    }

    onModelChanged(event) {
        this.updateReadyStatus();
    }

    runSegmentation(event) {
        event.preventDefault();
        this.inProgress = true;

        this.service.runLookALike({
            sourceGroupId: this.sourceFileItem ? '' : this.sourceGroupId,
            targetGroupId: this.targetFileItem ? '' : this.targetGroupId,
            name: this.name,
            notificationRequired: false,
            guid: this.guid,
            count: this.expectedCount,
            sex: this.sex
        }).then(this.callback.bind(this));
        setTimeout(() => this.showModal = false, 2000);
    }

    callback() {
        if (this.sourceFileItem) {
            this.sourceFileItem.file.name = this.name;
            this.sourceFileItem.upload();

            FileUploader.prototype.onCompleteItem = () => {
                this.uploadTargetFile();
            }
        } else {
            this.uploadTargetFile();
        }
    }

    uploadTargetFile() {
        if (this.targetFileItem) {
            this.targetFileItem.upload();
        }

        this.clear();
    }

    clear() {
        this.inProgress = false;
        this.showModal = true;
        this.name = '';
        this.sourceFileItem = null;
        this.targetFileItem = null;
        this.sourceGroupId = '';
        this.targetGroupId = '';
        this.sex = '0';
        this.updateReadyStatus();
        this.guid = Guid.New();
    }

}
