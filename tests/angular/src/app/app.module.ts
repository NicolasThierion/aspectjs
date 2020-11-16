import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { DeprecatedComponent } from './deprecated/deprecated.component';
import { RouterModule } from '@angular/router';
import { MemoComponent } from './memo/memo.component';

@NgModule({
    declarations: [AppComponent, DeprecatedComponent, MemoComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([
            {
                path: 'deprecated',
                component: DeprecatedComponent,
            },
            {
                path: 'memo',
                component: MemoComponent,
            },
        ]),
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
