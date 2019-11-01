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
    selector: 'result-phone',
    templateUrl: './component.html',
    styleUrls: ['../../analisys.component.css', '../../../app/app.css', './component.css',
        '../result.component.css',
        '../../../../dist/css/pixeladmin.css', '../../../../dist/css/themes/default.css'],
    providers: [CommonService]
})

export class PhonesResult implements OnInit {
    @Input() name: string;

    private result: any;
    private resultId: string;
    private resultCount: number;
    private totalCount: number;

    constructor(
        private service: CommonService,
        private vkService: vkService,
        private ref: ChangeDetectorRef,
        private capability: Capability,
        private cache: DataFuelCache) {

        this.resultId = window.location.pathname.split(`/`)[2];
    }

    ngOnInit() {
    }

    public init(data) {
        this.result = data.Result;
        this.resultCount = this.result.count;
        this.totalCount = this.result.phonesCount;
    }

    downloadFile() {
        this.service.postGetFile('savedPhones', { fileId: this.result.fileId, name: this.name });
    }
}