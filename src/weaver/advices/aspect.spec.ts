import { Before } from './before/before.decorator';
import { on } from './pointcut';
import { AClass } from '../../tests/a';
import { AfterContext, AfterReturnContext, AfterThrowContext, AroundContext, BeforeContext } from './advice-context';
import { AProperty, Labeled, setupWeaver } from '../../tests/helpers';
import { Around } from './around/around.decorator';
import { After } from './after/after.decorator';
import { AfterReturn } from './after-return/after-return.decorator';
import { AfterThrow } from './after-throw/after-throw.decorator';
import { AnnotationType } from '../..';
import { Aspect } from './aspect';

describe('given several aspects', () => {
    let labels: string[];

    beforeEach(() => {
        labels = [];
        setupWeaver(new LabelAspect('A'), new LabelAspect('B'));
    });

    @Aspect()
    class LabelAspect {
        constructor(public id: string) {}

        @Before(on.class.withAnnotations(AClass))
        beforeClass(ctxt: BeforeContext<Labeled, AnnotationType.CLASS>) {
            labels.push(`${this.id}_beforeClass`);
        }

        @Around(on.class.withAnnotations(AClass))
        aroundClass(ctxt: AroundContext<Labeled, AnnotationType.CLASS>) {
            labels.push(`${this.id}_AroundClass`);
            return ctxt.joinpoint();
        }

        @After(on.class.withAnnotations(AClass))
        afterClass(ctxt: AfterContext<Labeled, AnnotationType.CLASS>) {
            labels.push(`${this.id}_AfterClass`);
        }

        @AfterReturn(on.class.withAnnotations(AClass))
        afterReturnClass(ctxt: AfterReturnContext<Labeled, AnnotationType.CLASS>) {
            labels.push(`${this.id}_AfterReturnClass`);
            return ctxt.value;
        }

        @AfterThrow(on.class.withAnnotations(AClass))
        afterThrowClass(ctxt: AfterThrowContext<Labeled, AnnotationType.CLASS>) {
            labels.push(`${this.id}_AfterThrowClass`);
            throw ctxt.error;
        }

        @Before(on.property.withAnnotations(AProperty))
        beforeProperty(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_beforeProperty`);
        }

        @Around(on.property.withAnnotations(AProperty))
        aroundProperty(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AroundProperty`);
            return ctxt.joinpoint();
        }

        @After(on.property.withAnnotations(AProperty))
        afterProperty(ctxt: AfterContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterProperty`);
        }

        @AfterReturn(on.property.withAnnotations(AProperty))
        afterReturnProperty(ctxt: AfterReturnContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterReturnProperty`);
            return ctxt.value;
        }

        @AfterThrow(on.property.withAnnotations(AProperty))
        afterThrowProperty(ctxt: AfterThrowContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterThrowProperty`);
            throw ctxt.error;
        }

        @Before(on.property.setter.withAnnotations(AProperty))
        beforePropertySet(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_beforeSetProperty`);
        }

        @Around(on.property.setter.withAnnotations(AProperty))
        aroundPropertySet(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AroundSetProperty`);
            return ctxt.joinpoint();
        }

        @After(on.property.setter.withAnnotations(AProperty))
        afterPropertySet(ctxt: AfterContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterSetProperty`);
        }

        @AfterReturn(on.property.setter.withAnnotations(AProperty))
        afterReturnPropertySet(ctxt: AfterReturnContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterReturnSetProperty`);
        }

        @AfterThrow(on.property.setter.withAnnotations(AProperty))
        afterThrowPropertySet(ctxt: AfterThrowContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterThrowSetProperty`);
            throw ctxt.error;
        }
    }

    describe('constructing a class instance', () => {
        let A: any;

        beforeEach(() => {
            @AClass()
            // eslint-disable-next-line @typescript-eslint/class-name-casing
            class A_ {
                @AProperty()
                labels: string[];
            }

            A = A_;
        });

        it('should advices across all aspects in order', () => {
            expect(labels).toEqual([]);
            const a = new A();
            const expectedLabels = [
                'A_beforeClass',
                'B_beforeClass',
                'B_AroundClass',
                'A_AroundClass',
                'A_AfterReturnClass',
                'B_AfterReturnClass',
                'A_AfterClass',
                'B_AfterClass',
                // 'A_AfterThrowClass',
                // 'B_AfterThrowClass',
            ];

            expect(labels).toEqual(expectedLabels);

            console.log(a.labels);
            expectedLabels.push(
                'A_beforeProperty',
                'B_beforeProperty',
                'B_AroundProperty',
                'A_AroundProperty',
                'A_AfterReturnProperty',
                'B_AfterReturnProperty',
                'A_AfterProperty',
                'B_AfterProperty',
                // 'A_AfterThrowProperty',
                // 'B_AfterThrowProperty',
            );

            expect(labels).toEqual(expectedLabels);
            a.labels = [];

            expectedLabels.push(
                'A_beforeSetProperty',
                'B_beforeSetProperty',
                'B_AroundSetProperty',
                'A_AroundSetProperty',
                'A_AfterReturnSetProperty',
                'B_AfterReturnSetProperty',
                'A_AfterSetProperty',
                'B_AfterSetProperty',
                // 'A_AfterThrowSetProperty',
                // 'B_AfterThrowSetProperty',
            );

            expect(labels).toEqual(expectedLabels);
        });
    });
});
