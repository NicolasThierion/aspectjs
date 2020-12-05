import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoComponent } from './memo.component';

describe('MemoComponent', () => {
    let component: MemoComponent;
    let fixture: ComponentFixture<MemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MemoComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
