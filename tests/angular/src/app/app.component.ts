import { Component } from '@angular/core';
import { Memo, registerDefaultMemo } from '@aspectjs/memo';

registerDefaultMemo();
// getWeaver().enable(defaultMemoProfile);
localStorage.clear();

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    public i: number;
    constructor() {
        this.i = 0;
        const it = setInterval(() => this.incrementI(), 1);
        setTimeout(() => {
            clearInterval(it);
        }, 5000);
    }

    @Memo()
    incrementI(args?: any) {
        this.i++;
    }
}
