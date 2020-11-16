import { enableProdMode } from '@angular/core';
import { MEMO_PROFILE } from '@aspectjs/memo';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));

localStorage.clear();

MEMO_PROFILE.configure({
    supportsObservables: true,
}).register();
