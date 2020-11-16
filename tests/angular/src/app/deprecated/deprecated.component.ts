import { Component, OnInit } from '@angular/core';

import { AnnotationFactory, BeforeContext, on } from '@aspectjs/core/commons';
import { Aspect, Before } from '@aspectjs/core/annotations';
import { WEAVER_CONTEXT } from '@aspectjs/core';
import { isString } from '@aspectjs/core/utils';

const af = new AnnotationFactory('test');
const Deprecated = af.create(function Deprecated(version?: string): MethodDecorator {
    return;
});

@Aspect()
class DeprecatedAspect {
    private tags: Record<string, boolean> = {};
    @Before(on.method.withAnnotations(Deprecated))
    logWarnnig(context: BeforeContext) {
        if (!this.tags[context.target.ref]) {
            const args = context.annotation.args[0];
            console.warn(`${context.target.label} is deprecaed`);
            this.tags[context.target.ref] = true;
        }
    }
}

WEAVER_CONTEXT.getWeaver().enable(new DeprecatedAspect());

@Component({
    selector: 'app-deprecated',
    templateUrl: './deprecated.component.html',
    styleUrls: ['./deprecated.component.css'],
})
export class DeprecatedComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {
        this.deprecatedFunction();
        this.deprecatedFunction();
        this.deprecatedFunction();
        this.deprecatedFunction();
        this.deprecatedFunction();
    }
    @Deprecated()
    private deprecatedFunction() {
        console.log('deprecated function called');
    }
}
