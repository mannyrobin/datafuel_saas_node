import { NgModule } from '@angular/core';
import { BrowserModule }  from '@angular/platform-browser';
import { FormsModule }    from '@angular/forms';
import { RouterModule }   from '@angular/router';
import { HttpModule }    from '@angular/http';

import { AppComponent } from './app.component';
import { LoginModule } from '../login/login.module';
//import { LoginPage } from '../login/login.component';
import { AnalisysModule } from '../analisys/analisys.module';
//import { AnalisysPage } from '../analisys/analisys.component';

import { CommonService } from '../services/commonService';
import { SocketService } from '../services/socketService';
import { vkService } from '../services/vkService';
import { CanActivateViaAuthGuard } from './CanActivateViaAuthGuard';
import { Capability } from '../helpers/capabilities';
import { FeedbackLightbox } from './feedbackLightbox/FeedbackLightbox.component';
import { Lightbox } from '../lightbox/lightbox';

import { RateLightbox } from './RateLightbox/RateLightbox.Component';
import { PlaymentLightbox } from './playmentLightbox/playmentLightbox.component';

import { AnalisysPage } from '../analisys/analisys.component';

import 'ng2-bootstrap/ng2-bootstrap'; 

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        FormsModule,
        LoginModule,
        AnalisysModule,
        RouterModule.forRoot([
            {
                path: 'login',
                component: LoginModule
                //    loadChildren: '../login/login.module'
            },
            {
                path: 'analisys',
                component: AnalisysModule,
                children: [{
                    path: '',
                    component: AnalisysPage 
                }]
        //        canActivate : [ CanActivateViaAuthGuard]
              //  loadChildren: '../analisys/analisys.module'
            },
            {
                path: '',
                component: LoginModule
                //                loadChildren: '../login/login.module'
            },
        ]),
    ],
    providers: [CommonService, CanActivateViaAuthGuard, Capability, vkService, SocketService],
    declarations: [
        AppComponent,
        RateLightbox,
        PlaymentLightbox,
    //   DropdownMenuComponent,
  //      Lightbox,
  //      FeedbackLightbox,
    ],
    bootstrap: [AppComponent]
})

export class AppModule { 
}
