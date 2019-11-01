import { Component } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';

@Component({
    selector: 'blog',
    templateUrl: './blog.component.html',
    styleUrls: ['../rate/rate.component.css'],
    providers: [CommonService]
})

export class BlogComponent {
    private rates: string[];

    constructor(
        private service: CommonService,
        private router: Router) {
 //           service.getRates().then(this.blogListRecieved.bind(this));
    }

    blogListRecieved(data) {
        this.rates = data.json();
    }
}

