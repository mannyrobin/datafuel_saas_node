import { Component } from '@angular/core';
import { CommonService } from '../services/commonService';
import { Router } from '@angular/router';

@Component({
    selector: 'login-page',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css', '../app/app.css'],
    providers: [CommonService]
})

export class LoginPage {
    constructor(
        private service: CommonService,
        private router: Router) {

        if (!window['DEV'] && window['VK'] != null) {
            window['VK'].init({
                apiId: 5962277, 
                version: 5.73
            });
        }

        localStorage.setItem('loggedIn', '0');

        if (window.location.search.indexOf('auto=1') > 0) {
            this.clickHandler();
        }
    }

    clickHandler() {
        //  Доступ к email пользователя (+4194304); ads (+32768)
        if (!window['DEV']) {
            window['VK'].Auth.login(this.loginHandler.bind(this), /*4194304+*/32768);
        } else {
            const router = this.router;

            let groupId = '0';
            let memberId = '0';
            let userId = `group${groupId} member${memberId}`;
            let id = parseInt(groupId + memberId) + 2781070 + 50000;
            localStorage.setItem("firstName", userId);
            localStorage.setItem("lastName", '');

            this.service.login({ expire: Math.round(new Date().getTime() / 1000.0) + 600000, user: { id, first_name: userId, href: '' } }).then(
                () => {
                    router.navigateByUrl('/user-profile');
                    localStorage.setItem('loggedIn', '1');
                }
            );
        }
    }

    loginHandler(data) {
        const router = this.router;

        if (data.status != 'connected') {
            alert(JSON.stringify(data));
            return;
        }

        localStorage.setItem("firstName", data.session.user.first_name);
        localStorage.setItem("lastName", data.session.user.last_name);

        this.service.login(data.session).then(
            () => {
                router.navigateByUrl('/user-profile');
                localStorage.setItem('loggedIn', '1');
            }
        );
    }

    scrollTo(elementId) {
        document.getElementById(elementId).scrollIntoView();
    }
}