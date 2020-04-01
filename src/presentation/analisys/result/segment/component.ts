import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonService } from '../../../services/commonService';
import { vkService } from '../../../services/vkService';
import { Router } from '@angular/router';

import { ImportSegmentData } from '../../../models/importSegmentData';
import { User } from '../../../models/user';
import { NameCountPair } from '../../../models/nameCountPair';
import { Mbti_Types } from '../../../models/mbti_types';
import { Capability } from '../../../helpers/capabilities';

import { DataFuelCache } from '../../../cache/dataFuelCache';

@Component({
    selector: 'result-segment',
    templateUrl: './component.html',
    styleUrls: ['../../analisys.component.css', '../../../app/app.css', './component.css',
        '../result.component.css',
        '../../../../dist/css/pixeladmin.css', '../../../../dist/css/themes/default.css'],
    providers: [CommonService]
})

export class SegmentResult implements OnInit {
    @Input() segments: NameCountPair[];
    @Input() name: string;

    private hasAccountId: boolean = false;
    private advertisementAccountId: string;
    private inProgress: boolean = false;
    private resultId: string;
    private progress: number = 0;
    private resources: Mbti_Types = new Mbti_Types();

    private downloadFileHandler: any;
    private importTargetContactsHandler: any;
    private selectSegmentHandler: any;
    private exportSelectedSegmentsHandler: any;
    private updateAccountIdHandler: any;
    private exportGroupNameChangedHandler: any;

    private selectedSegments: NameCountPair[] = [];
    private actionButtonDisabled: boolean = true;

    private exportLimit: number;
    private errorMessage: string = null;

    private MaxNameLength: number = 64;
    private exportGroupName: string = null;

    private selectLogicsHandler: any;
    private selectIntuitHandler: any;
    private selectSensorsHandler: any;
    private selectEticsHandler: any;

    constructor(
        private service: CommonService,
        private vkService: vkService,
        private ref: ChangeDetectorRef,
        private capability: Capability,
        private cache: DataFuelCache) {

        this.resultId = window.location.pathname.split(`/`)[2];
        this.importTargetContactsHandler = this.importTargetContacts.bind(this);
        this.downloadFileHandler = this.downloadFile.bind(this);
        this.selectSegmentHandler = this.selectSegment.bind(this);
        this.exportSelectedSegmentsHandler = this.exportSelectedSegments.bind(this);
        this.updateAccountIdHandler = this.updateActionButtons.bind(this);
        this.exportGroupNameChangedHandler = this.exportGroupNameChanged.bind(this);

        this.selectEticsHandler = this.selectEtics.bind(this);
        this.selectLogicsHandler = this.selectLogics.bind(this);
        this.selectIntuitHandler = this.selectIntuit.bind(this);
        this.selectSensorsHandler = this.selectSensors.bind(this);

        this.advertisementAccountId = localStorage.getItem(`accountId`);
    }

    ngOnInit() {
        this.service.getUser().then((info: User) => {
            localStorage.setItem(`accountId`, (info.AccountId || ``).toString());
            this.hasAccountId = info.AccountId != null;
            this.exportLimit = info.ExportLimit;
        });

        this.hasAccountId = localStorage.getItem(`accountId`) != `null`;
        this.advertisementAccountId = localStorage.getItem(`accountId`);
        this.updateActionButtons();
    }

    /**
     * Select romantics
     */
    selectLogics() {
        var types = ['ESFJ', 'ESFP', 'ISFP', 'ISFJ'];
        this.segments.forEach(s => {
            s.Selected = types.indexOf(s.Type) > -1;
        });
        this.selectedSegments = this.segments.filter(segment => segment.Selected);
        this.updateSelectedItems();
    }

    /**
     * selects Novators
     */
    selectIntuit() {
        var types = ['ENFP', 'ENFJ', 'INFJ', 'INFP'];
        this.segments.forEach(s => {
            s.Selected = types.indexOf(s.Type) > -1;
        });
        this.selectedSegments = this.segments.filter(segment => segment.Selected);
        this.updateSelectedItems();
    }

    /**
     * Selects Pragmatists.
     */
    selectSensors() {
        var types = ['ENTP', 'INTJ', 'ENTJ', 'INTJ'];
        this.segments.forEach(s => {
            s.Selected = types.indexOf(s.Type) > -1;
        });
        this.selectedSegments = this.segments.filter(segment => segment.Selected);
        this.updateSelectedItems();
    }

    /**
     * Selects Conservative.
     */
    selectEtics() {
        var types = ['ISTJ', 'ESTJ', 'ESTP', 'ISTP'];
        this.segments.forEach(s => {
            s.Selected = types.indexOf(s.Type) > -1;
        });
        this.selectedSegments = this.segments.filter(segment => segment.Selected);
        this.updateSelectedItems();
    }

    updateActionButtons() {
        this.actionButtonDisabled =
            (this.advertisementAccountId == '' || this.advertisementAccountId == null)
            && !(this.cache.CurrentUser.Capability & this.capability.admin)
            && !(this.cache.CurrentUser.Capability & this.capability.exportToFile);
    }

    getTitle() {
        if (!!this.advertisementAccountId) {
            return 'экспортировать в рекламный кабинет';
        } else {
            return 'выберите сегменты для экспорта в файл (требуется специальная лицензия для экспорта в файл)';
        }
    }

    exportSelectedSegments() {
        let types = this.selectedSegments.map(segment => segment.Type);
        let count = 0;

        this.selectedSegments.forEach(s => count += s.Count);

        if (!this.canExport(count)) {
            this.errorMessage = 'превышено ограничение на экспорт';
            return;
        }

        if (!this.advertisementAccountId) {
            this.service.download(types.join('_'), this.resultId, this.name);
        } else {
            this.importTargetContacts(types);
        }
    }

    canExport(count: number): boolean {
        return count < this.exportLimit || this.exportLimit == null;
    }

    exportGroupNameChanged() {
        if (this.exportGroupName.length > this.MaxNameLength) {
            this.exportGroupName = this.exportGroupName.substring(0, this.MaxNameLength - 2) + '..';
        }
    }

    selectSegment(event) {
        let target = event.target;
        this.selectedSegments = this.segments.filter(segment => (segment.Selected && segment.Type != target.value) || (segment.Type == target.value && target.checked));
        this.updateSelectedItems();
    }

    updateSelectedItems() {
        let count = 0;
        this.exportGroupName = this.name;
        this.selectedSegments.forEach(s => {
            count += s.Count;
            this.exportGroupName += `_${s.Type}`;
        });

        this.exportGroupNameChanged();

        if (!this.canExport(count)) {
            this.errorMessage = 'превышено ограничение на экспорт';
        } else {
            this.errorMessage = null;
        }

        this.ref.detectChanges();
    }

    importTargetContacts(name: string[]) {
        if (this.exportGroupName == null) {
            this.exportGroupName = this.name;
        }

        let count = 0;
        let selectedSegments = this.segments.filter(s => name.indexOf(s.Type) > -1);
        selectedSegments.forEach(s => count += s.Count);

        if (!this.canExport(count)) {
            this.errorMessage = 'превышено ограничение на экспорт';
            this.ref.detectChanges();
            window['$']('.modal-body').animate({ scrollTop: 1 })
            return;
        } else {
            this.errorMessage = null;
        }

        if (name.length == 1 && this.exportGroupName == this.name) {
            this.exportGroupName += `_${name[0]}`;
            this.exportGroupNameChanged();
        }

        this.inProgress = true;
        var self = this;
        this.service.getSegment(name.join('_'), this.resultId).then((result: ImportSegmentData) => {
            localStorage.setItem(`accountId`, this.advertisementAccountId);
            this.service.updateUserAdvertisementId(this.advertisementAccountId);

            this.vkService.createTargetGroup(this.exportGroupName, result.UserIds, parseInt(this.advertisementAccountId), (progress: number) => {
                self.progress = progress;
                self.inProgress = this.progress < 100;
                this.ref.detectChanges();
            });
        });
    }

    downloadFile(resultType: string) {
        let count = 0;

        this.segments.filter(s => s.Type == resultType).forEach(s => count += s.Count);

        if (!this.canExport(count)) {
            this.errorMessage = 'превышено ограничение на экспорт';
        } else {
            this.errorMessage = null;
            this.service.download(resultType, this.resultId, this.name);
        }
    }
}