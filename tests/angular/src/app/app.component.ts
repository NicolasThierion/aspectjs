import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Memo, ObservableMarshaller, registerDefaultMemo } from '@aspectjs/memo';
import { shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AfterReturn, AfterReturnContext, Aspect, getWeaver, on } from '@aspectjs/core';

// getWeaver().enable(defaultMemoProfile);
localStorage.clear();

@Aspect({ priority: 2000 })
class ObservableMemoAspect {
    @AfterReturn(on.method.withAnnotations(Memo))
    shareReplay(ctxt: AfterReturnContext) {
        if (ctxt.value instanceof Observable) {
            return ctxt.value.pipe(shareReplay(1));
        }
        return ctxt.value;
    }
}
getWeaver().enable(new ObservableMemoAspect());
registerDefaultMemo({
    marshallers: [new ObservableMarshaller()],
});

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    public i: number;
    public users: any[];
    constructor(private httpClient: HttpClient) {}

    @Memo()
    incrementI(args?: any) {
        return this.i++;
    }

    @Memo()
    fetchUsers() {
        return this.httpClient.get('https://jsonplaceholder.typicode.com/users');
    }

    repeat(fn: () => void) {
        const it = setInterval(fn, 10);
        setTimeout(() => {
            clearInterval(it);
        }, 5000);
    }

    ngOnInit(): void {
        this.i = 0;
        this.repeat(() => this.incrementI());
        // this.repeat(() => this.fetchUsers().subscribe((u) => (this.users = u as any)));
        const o = this.fetchUsers();
        o.subscribe((u) => (this.users = u as any));
        o.subscribe((u) => (this.users = u as any));
        o.subscribe((u) => (this.users = u as any));
        o.subscribe((u) => (this.users = u as any));
        o.subscribe((u) => (this.users = u as any));
        o.subscribe((u) => (this.users = u as any));
        o.subscribe((u) => (this.users = u as any));
        o.subscribe((u) => (this.users = u as any));
        o.subscribe((u) => (this.users = u as any));
        // this.repeat(() => this.fetchUsers().subscribe((u) => (this.users = u as any)));
    }
}
