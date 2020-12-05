import { Component, OnInit } from '@angular/core';

import { AnnotationFactory, AnnotationType, BeforeContext, on } from '@aspectjs/core/commons';
import { Aspect, Before, Order } from '@aspectjs/core/annotations';
import { WEAVER_CONTEXT } from '@aspectjs/core';
import { Memo } from '@aspectjs/memo';

const af = new AnnotationFactory('test');
const Deprecated = af.create(function Deprecated(version?: string): any {
    return;
});
console.log(Deprecated.ref);
@Aspect()
class DeprecatedAspect {
    private tags: Record<string, boolean> = {};

    @Before(on.method.withAnnotations(Deprecated))
    @Before(on.parameter.withAnnotations(Deprecated))
    @Before(on.class.withAnnotations(Deprecated))
    @Order(1)
    logWarning(context: BeforeContext) {
        if (!this.tags[context.target.ref]) {
            const args = context.annotations.onSelf(Deprecated)[0].args[0];
            if (
                context.target.type !== AnnotationType.PARAMETER ||
                context.args[context.target.parameterIndex] !== undefined
            ) {
                console.warn(`${context.target.label} is deprecated`);
                this.tags[context.target.ref] = true;
            }
        }
    }
}

WEAVER_CONTEXT.getWeaver().enable(new DeprecatedAspect());

@Deprecated()
@Component({
    selector: 'app-deprecated',
    templateUrl: './deprecated.component.html',
    styleUrls: ['./deprecated.component.css'],
})
export class DeprecatedComponent implements OnInit {
    name: string;

    constructor() {}

    ngOnInit(): void {
        this.deprecatedFunction();
        this.deprecatedFunction();
        this.deprecatedFunction();
        this.deprecatedFunction('');
        this.deprecatedFunction();

        // this.deprecatedFunctionParam('x');
    }

    @Memo()
    private deprecatedFunctionParam(
        @Deprecated()
        arg?: string,
    ) {
        console.log('deprecatedFunctionParam');
    }

    @Deprecated()
    private deprecatedFunction(
        @Deprecated()
        arg?: string,
    ) {
        console.log('deprecatedFunction');
    }
}
