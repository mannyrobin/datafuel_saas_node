import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './presentation/app/app.module';
import { LoginModule } from './presentation/login/login.module';

import '../public/css/styles.css';

if (window.location.hostname == 'localhost') {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
