import { Component } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';

@Component({
    selector: 'knowledgeDataBase',
    templateUrl: './knowledgeDataBase.component.html',
    styleUrls: ['../rate/rate.component.css'],
    providers: [CommonService]
})

export class KnowledgeDataBaseComponent {
    private rates: string[];

    constructor(
        private service: CommonService,
        private router: Router) {
        //    service.getRates().then(this.knowledgeDataBasesRecieved.bind(this));
    }

    knowledgeDataBasesRecieved(data) {
        this.rates = data.json();
    }
}

