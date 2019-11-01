import { Component } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';
import { Capability } from '../../helpers/capabilities';

@Component({
    selector: 'busy-page',
    templateUrl: './busy.component.html',
    styleUrls: ['../analisys.component.css', '../../app/app.css', 
        '../../../dist/css/bootstrap.css',
        '../../../dist/css/pixeladmin.css', '../../../dist/css/themes/default.css'],
    providers: [CommonService]
})

export class BusyPage {
    private intervalId: number;
    private inprogress: boolean;
    private type: string;

    private markBrokenHandler: any;
    private hasPermissions: boolean = false;
    private progress: number = 0;

    constructor(
        private service: CommonService,
        private router: Router,
        capability: Capability) {
        this.inprogress = false;
        this.intervalId = setInterval(this.polling.bind(this), 1000);

        this.markBrokenHandler = this.markBroken.bind(this);

        this.hasPermissions = !!(Number(localStorage.getItem('capability')) & capability.admin);

        // dirty hack
        this.getType();
    }

    private polling() {
        if (this.inprogress) {
            return;
        }

        this.inprogress = true;

        this.type = window.location.pathname.split('/')[2];

        switch (this.type) {
            case 'segment':
                this.checkSegmentationStatus();
                break;
            case 'analisys':
                this.checkAnalisysStatus();
                break;
        }
    }

    private checkSegmentationStatus() {
        this.service.checkSegmentationStatus().then((data) => {
            this.inprogress = false;
            this.progress = data.progress;
            localStorage.setItem('segmentation-progress', (this.progress || '').toString());

            if (!data.busy) {
                clearInterval(this.intervalId);

                this.router.navigateByUrl('/segment');
            }
        });
    }

    private checkAnalisysStatus() {
        this.service.checkAnalisysStatus().then((data) => {
            this.inprogress = false;
            this.progress = data.progress;
            localStorage.setItem('analisys-progress', (this.progress || '').toString());

            if (!data.busy) {
                clearInterval(this.intervalId);

                this.router.navigateByUrl('/analisys');
            }
        });
    }

    private getStatus() {
        if (this.progress == 0) {
            return 'идет выгрузка пользователей из ВК';
        }

        return `запрос выполнен на ${this.progress.toFixed(2)}%`;
    }

    private markBroken() {
        this.service.markResultBroken(window.location.pathname.split('/')[2]).then(res => this.router.navigateByUrl(`/${this.type}`));
    }

    private getType() {
        this.type = window.location.pathname.split('/')[2];
        
        switch (this.type.toLowerCase()) {
            case 'analisys':
                this.progress = parseInt(localStorage.getItem('analisys-progress') || '0');
                return 'Анализ';
            default:
                this.progress = parseInt(localStorage.getItem('segmentation-progress') || '0');
                return 'Сегментация';
        }
    }
}
