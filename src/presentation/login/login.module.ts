import { NgModule } from '@angular/core';
import { BrowserModule }  from '@angular/platform-browser';
import { FormsModule }    from '@angular/forms';
import { RouterModule }   from '@angular/router';
import { HttpModule }    from '@angular/http';

import { LoginPage } from './login.component';
import { RateComponent } from './rate/rate.component';
import { BlogComponent } from './blog/blog.component';
import { KnowledgeDataBaseComponent } from './knowledgeDataBase/knowledgeDataBase.component';

import { CommonService } from '../services/commonService';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        FormsModule,
        RouterModule.forRoot([
            { path: 'login', component: LoginPage },
         //   { path: 'analisys', redirectTo: '../analisys/analisys.module' },
            /* { path: 'crisis-center', component: CrisisListComponent },
             {
                 path: 'heroes',
                 component: HeroListComponent,
                 data: {
                     title: 'Heroes List'
                 }
             },*/
           // { path: '', redirectTo: '/login', pathMatch: 'full' },
            /* { path: '**', component: PageNotFoundComponent }*/
        ])
    ],
  exports: [
    RouterModule
  ],
    providers: [CommonService],
    declarations: [
        LoginPage,
   //     RateComponent,
   //     KnowledgeDataBaseComponent,
  //      BlogComponent
    //    AnalisysPage
        /*  HeroListComponent,
          HeroDetailComponent,
          CrisisListComponent,
          PageNotFoundComponent*/
    ],
    bootstrap: [LoginPage]
})

export class LoginModule { }
