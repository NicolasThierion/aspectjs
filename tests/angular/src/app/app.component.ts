import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// import { shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AfterReturn, Around, Aspect, Before } from '@aspectjs/core/annotations';
import {
    AfterReturnContext,
    AnnotationFactory,
    AroundContext,
    BeforeContext,
    JoinPoint,
    on,
} from '@aspectjs/core/commons';
// import { Memo } from '@aspectjs/memo/dist/src/memo.annotation';
import { WEAVER_CONTEXT } from '@aspectjs/core';

// getWeaver().enable(defaultMemoProfile);
localStorage.clear();

const Monitored = new AnnotationFactory('test').create(function Monitored() {
    return undefined as any;
});

@Aspect()
class MonitoredAspect {
    @Around(on.method.withAnnotations(Monitored))
    logBefore(ctxt: AroundContext, jp: JoinPoint) {
        console.log(`before ${ctxt.target.label}`);
        jp();
        console.log(`after ${ctxt.target.label}`);
    }
}

// @Aspect()
// class ObservableMemoAspect {
//     // @AfterReturn(on.method.withAnnotations(Memo))
//     // shareReplay(ctxt: AfterReturnContext) {
//     //     if (ctxt.value instanceof Observable) {
//     //         return ctxt.value.pipe(shareReplay(1));
//     //     }
//     //     return ctxt.value;
//     // }
// }

WEAVER_CONTEXT.getWeaver().enable(
    // new ObservableMemoAspect(),
    new MonitoredAspect(),
);
// registerDefaultMemo({
//     marshallers: [new ObservableMarshaller()],
// });

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    public i: number;
    public users: any[];
    constructor(private httpClient: HttpClient) {}

    // @Memo()
    incrementI(args?: any) {
        return this.i++;
    }

    // @Memo()
    fetchUsers() {
        return this.httpClient.get('https://jsonplaceholder.typicode.com/users');
    }

    repeat(fn: () => void) {
        const it = setInterval(fn, 10);
        setTimeout(() => {
            clearInterval(it);
        }, 5000);
    }

    @Monitored()
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
