import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Cacheable, Memo } from '@aspectjs/memo';
import { AnnotationFactory } from '@aspectjs/core/commons';

@Cacheable()
class User {}

const AProp = new AnnotationFactory('test').create(function AProp(): PropertyDecorator {
    return;
});

@Component({
    selector: 'app-memo',
    templateUrl: './memo.component.html',
    styleUrls: ['./memo.component.css'],
})
export class MemoComponent implements OnInit {
    @AProp()
    public i: number;
    public users: any[];
    constructor(private httpClient: HttpClient) {}

    @Memo()
    incrementI(args?: any) {
        return ++this.i;
    }

    @Memo()
    fetchUsers() {
        return this.httpClient.get('https://jsonplaceholder.typicode.com/users').pipe(
            map((response: any[]) => {
                return response.map((r) => {
                    const u = new User();
                    Object.assign(u, r);
                    return u;
                    // return r;
                });
            }),
        );
    }

    repeat(fn: () => void) {
        const it = setInterval(fn, 10);
        setTimeout(() => {
            clearInterval(it);
        }, 500);
    }

    ngOnInit(): void {
        this.i = 0;
        this.fetchUsers().subscribe((r) => ((window as any).users = r));
        this.repeat(() => this.incrementI());
        this.repeat(() => this.fetchUsers().subscribe((u) => (this.users = u as any)));
    }
}
