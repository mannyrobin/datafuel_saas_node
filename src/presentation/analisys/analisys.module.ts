import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { BrowserModule }  from '@angular/platform-browser';
import { FormsModule }    from '@angular/forms';
import { RouterModule }   from '@angular/router';
import { HttpModule }    from '@angular/http';

// import { BaseChartDirective } from 'ng2-charts/components/charts/charts';
import { BaseChartDirective } from 'ng2-charts/components/charts/charts';

import { AnalisysPage } from './analisys.component';
import { SearchByPhonePage } from './searchByPhone/searchByPhone.page';
import { AdminPage } from './admin/admin.page';
import { UserProfilePage } from './userProfile/userProfile.page';
import { ResultListPage } from './results/results.component';
import { ResultPage } from './result/result.component';
import { MasterPage } from './master.page';
import { BusyPage } from './busyPage/busy.component';
import { LookALikePage } from './look-a-like/look-a-like.component';
import { AttachFileLightbox } from './attachFileLightbox/attachFileLightbox.component';
import { Lightbox } from '../lightbox/lightbox';
import {CanActivateViaAuthGuard} from '../app/CanActivateViaAuthGuard';
import { FeedbackLightbox } from '../app/feedbackLightbox/FeedbackLightbox.component';

import { HorizontalGraph } from '../controls/HorizontalGraph/component';
import { SegmentResult } from './result/segment/component';
import { AnalisysComponent } from './result/analisys/analisys.component';
import { PhonesResult } from './result/searchByPhones/component';

import { CommonService } from '../services/commonService';
import { FileSelectDirective, FileDropDirective, FileUploader }  from 'ng2-file-upload/ng2-file-upload';
import { MessageBus } from '../messageBus/messageBus';
import { DataFuelCache } from '../cache/dataFuelCache';

//
//import { Ng2TableModule } from 'ng2-table/ng2-table';
import { Ng2TableModule, NgTableFilteringDirective } from 'ng2-table/ng2-table';

import {PaginationModule} from 'ng2-bootstrap/ng2-bootstrap'; 
import { FlotModule } from 'ng2modules-flot';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        Ng2TableModule,
        FlotModule,
   //     TabsModule,
       PaginationModule,
        //    ChartsModule,
        FormsModule,
        RouterModule.forChild([
            {
                path: '', component: MasterPage,
                children: [
                    {
                        path: '', redirectTo: 'user-profile', pathMatch: 'full',
                    },
                    {
                        path: 'look-a-like', component: LookALikePage,
                        canActivate: [CanActivateViaAuthGuard]
                    },
                    {
                        path: 'analisys', component: AnalisysPage,
                        canActivate: [CanActivateViaAuthGuard]
                    },
                    {
                        path: 'results', component: ResultListPage,
                        canActivate: [CanActivateViaAuthGuard]
                    },
                    {
                        path: 'results/:id', component: ResultPage,
                        canActivate: [CanActivateViaAuthGuard]
                    },
                    {
                        path: 'busy/:type', component: BusyPage,
                        canActivate: [CanActivateViaAuthGuard]
                    },
                    {
                        path: 'admin', component: AdminPage,
                        canActivate: [CanActivateViaAuthGuard]
                    },
                    {
                        path: 'user-profile', component: UserProfilePage,
                        canActivate: [CanActivateViaAuthGuard]
                    }, {
                        path: 'searchByPhone',
                        component: SearchByPhonePage,
                        canActivate: [CanActivateViaAuthGuard]
                    }
                ]
            },

            /* { path: '**', component: PageNotFoundComponent }*/
        ])
    ],
    exports: [
        RouterModule,
        Lightbox,
        FeedbackLightbox
    ],
    providers: [CommonService, CanActivateViaAuthGuard, MessageBus, DataFuelCache],
    declarations: [
        MasterPage,
        SearchByPhonePage,
        AdminPage,
        AnalisysPage,
        LookALikePage,
        AttachFileLightbox,
        Lightbox,
        FeedbackLightbox,
        FileSelectDirective,
        FileDropDirective,
        BusyPage,
        ResultListPage,
        ResultPage,
        BaseChartDirective,
        HorizontalGraph,
        SegmentResult,
        PhonesResult,
        AnalisysComponent,
        UserProfilePage
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    bootstrap: [MasterPage]
})

export class AnalisysModule { }