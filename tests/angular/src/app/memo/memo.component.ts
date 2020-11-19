import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cacheable, Memo } from '@aspectjs/memo';
import { map } from 'rxjs/operators';

@Cacheable()
class User {}
@Component({
    selector: 'app-memo',
    templateUrl: './memo.component.html',
    styleUrls: ['./memo.component.css'],
})
export class MemoComponent implements OnInit {
    public i: number;
    public users: any[];
    constructor(private httpClient: HttpClient) {}

    @Memo()
    incrementI(args?: any) {
        return this.i++;
    }

    @Memo()
    fetchUsers() {
        return this.httpClient.get('https://jsonplaceholder.typicode.com/users').pipe(
            map((response: any[]) => {
                return response.map((r) => {
                    const u = new User();
                    Object.assign(u, r);
                    return u;
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
        this.repeat(() => this.incrementI());
        this.repeat(() => this.fetchUsers().subscribe((u) => (this.users = u as any)));
    }
}
