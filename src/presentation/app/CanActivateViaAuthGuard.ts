import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { CommonService } from '../services/commonService';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Capability } from '../helpers/capabilities';

import { DataFuelCache } from '../cache/dataFuelCache';

@Injectable()
export class CanActivateViaAuthGuard implements CanActivate {

    constructor(private authService: CommonService,
        private router: Router,
        private capability: Capability,
        private cache: DataFuelCache
    ) { }

    canActivate(snapshot, route): any {
        let user = this.cache.CurrentUser;
        if (user == null && window.location.pathname !== '/login') {
            return this.authService.isLoggedIn().then(user => {
                if (!user.auth) {
                    this.authService.logout();
                    this.router.navigateByUrl('/login');
                }
                
                return user.auth;
            });
        }

        const targetPage = route.url.split('/')[1];

        if (targetPage == 'analisys' || targetPage == 'user-profile' || targetPage == 'results') {
            return true;
        }

        const requiredCapability = this.capability[route.url.split('/')[1]];
        if (requiredCapability != null && !(requiredCapability & user.Capability) && !(user.Capability & this.capability.admin)) {
            return false;
        }

        return true;
    }
}