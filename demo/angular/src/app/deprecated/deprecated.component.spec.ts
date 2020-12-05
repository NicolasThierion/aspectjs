import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeprecatedComponent } from './deprecated.component';

describe('DeprecatedComponent', () => {
    let component: DeprecatedComponent;
    let fixture: ComponentFixture<DeprecatedComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DeprecatedComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DeprecatedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
