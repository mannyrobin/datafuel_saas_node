import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { vkService } from '../../services/vkService';
import { Router } from '@angular/router';
import { Capability } from '../../helpers/capabilities';

import { ImportSegmentData } from '../../models/importSegmentData';
import { User } from '../../models/user';
import { NameCountPair } from '../../models/nameCountPair';
import { HorizontalGraphData } from '../../models/horizontalGraphData';
import { Mbti_Types } from '../../models/mbti_types';
import { MedianValue } from '../../models/medianValue';
import { ResultViewModel } from '../../models/resultViewModel';
import { ExportResultModel } from '../../models/exportResultModel';
import { ChartData } from '../../models/chartData';
import { Sex } from '../../models/sex';

import { DescriptionUrl } from '../../helpers/descriptionUrl';
import { ResultStrings } from '../../strings/result';
import { AnalisysComponent } from './analisys/analisys.component';
import { PhonesResult } from './searchByPhones/component';

@Component({
    selector: 'result-page',
    templateUrl: './result.component.html',
    styleUrls: ['../analisys.component.css', '../../app/app.css',
        './result.component.css',
        '../../../dist/css/pixeladmin.css', '../../../dist/css/themes/default.css'],
    providers: [CommonService]
})

export class ResultPage implements OnInit {
    @ViewChild(AnalisysComponent)
    public analisysPanel: AnalisysComponent;

    @ViewChild(PhonesResult)
    public phonesPanel: PhonesResult;

    private descriptionUrls: DescriptionUrl = new DescriptionUrl();

    private exportSegmentModal: boolean = false;
    private exportSegmentsAvailable: boolean = false;

    private viewModel = new ResultViewModel();
    private exportModel = new ExportResultModel(parseInt(window.location.pathname.split(`/`)[2]));

    private pageReady: boolean = false;
    private groupsReady: boolean = false;
    private results: any;
    private type: string = 'analisys';
    private name: string;

    private empty: boolean;

    private segments: NameCountPair[] = [];

    private resultId: string;
    private totalCount: string;

    private deleteHandler: any;
    private hasPermissions: boolean = false;

    private exportResultHandler: any;
    private nameChangeHandler: any;
    private nameEditHandler: any;
    private nameChangeCancelHandler: any;
    private showExportDialogHandler: any;
    private runSexAnalisysHandler: any;
    private hideConfirmDialogHandler: any;
    private runGroupAnalisysHandler: any;
    private showConfirmDialogHandler: any;
    private hideGroupAnalisysHandler: any;
    private markBrokenHandler: any;

    private newName: string;
    private nameUpdated: boolean = true;
    private showConfirm: boolean = false;
    private showGroupConfirm: boolean = false;

    private hasDevCapability: boolean = false;

    private dataset: any[] = [];
    private emptyMessage: string;

    private dev: boolean = false;
    private confirmDialogBody: string = '';

    private errorMessage: string;
    private hideAnalisys: boolean = true;

    constructor(
        private service: CommonService,
        private router: Router,
        private capability: Capability,
        private vkService: vkService,
        private ref: ChangeDetectorRef) {

            this.dev = localStorage.getItem('DEV') === '1';

        this.nameChangeHandler = this.nameChanged.bind(this);
        this.nameChangeCancelHandler = this.changeNameCanceled.bind(this);
        this.nameEditHandler = this.editName.bind(this);
        this.exportResultHandler = this.exportResult.bind(this);
        this.deleteHandler = this.delete.bind(this);
        this.markBrokenHandler = this.markBroken.bind(this);
        this.showExportDialogHandler = this.showExportDialog.bind(this);
        this.hideConfirmDialogHandler = this.hideConfirmDialog.bind(this);

        this.hasPermissions = !!(Number(localStorage.getItem(`capability`)) & capability.admin);
        this.hasDevCapability = !!(Number(localStorage.getItem(`capability`)) & capability.dev);

        this.resultId = window.location.pathname.split(`/`)[2];

        this.service
            .getResult(this.resultId)
            .then((data) => {
                this.type = data.Type;
                this.pageReady = true;
                this.name = data.Name;
                this.totalCount = data.Result.count;
                switch(this.type) {
                    case 'usersByPhones': return this.phonesPanel.init(data);
                    default: 
                        this.hideAnalisys = false;
                        return setTimeout(() => this.analisysPanel.init(data));
                }
            });
    }

    ngOnInit(): void {
    }

    delete() {
        this.service.removeResult(window.location.pathname.split(`/`)[2]).then(res => this.router.navigateByUrl(`/results`));
    }

    markBroken() {
        this.service.removeResult(window.location.pathname.split(`/`)[2]).then(res => this.router.navigateByUrl(`/results`));
    }

    showExportDialog() {
        this.exportSegmentModal = !this.exportSegmentModal;
    }

    exportResult() {
        this.service.exportExcel(this.exportModel).then(() => {
            this.service.getExportFile(parseInt(this.resultId));
        });
    }

    hideConfirmDialog() {
        this.showConfirm = false;
    }

    private nameChanged() {
        this.nameUpdated = true;
        this.name = this.newName;
        this.service.updateResultName(this.resultId, this.name);
    }

    private changeNameCanceled() {
        this.nameUpdated = true;
        this.newName = this.name;
    }

    private editName() {
        this.newName = this.name;
        this.nameUpdated = false;
    }

    // events
    private chartClicked(e: any): void {
    }

    private chartHovered(e: any): void {
    }

    /*clickHandler() {
        this.service.logout().then(() => this.router.navigateByUrl(`/login`));
    }*/
}
