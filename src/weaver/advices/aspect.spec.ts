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
import { Compile } from './compile/compile.decorator';

describe('given several aspects', () => {
    let labels: string[];

    beforeEach(() => {
        labels = [];
        setupWeaver(new LabelAspect('A'), new LabelAspect('B'));
    });

    @Aspect()
    class LabelAspect {
        constructor(public id: string) {}

        @Compile(on.class.withAnnotations(AClass))
        compileClass(ctxt: BeforeContext<Labeled, AnnotationType.CLASS>) {
            const id = this.id;
            return function() {
                labels.push(`${id}_compileClass`);
            };
        }

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

        @Compile(on.property.withAnnotations(AProperty))
        compileProperty(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
            const id = this.id;

            return {
                get() {
                    labels.push(`${id}_compilePropertyGet`);
                },
                set() {
                    labels.push(`${id}_compilePropertySet`);
                },
            };
        }
        @Before(on.property.withAnnotations(AProperty))
        beforeProperty(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_beforePropertyGet`);
        }

        @Around(on.property.withAnnotations(AProperty))
        aroundProperty(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AroundPropertyGet`);
            return ctxt.joinpoint();
        }

        @After(on.property.withAnnotations(AProperty))
        afterProperty(ctxt: AfterContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterPropertyGet`);
        }

        @AfterReturn(on.property.withAnnotations(AProperty))
        afterReturnProperty(ctxt: AfterReturnContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterReturnPropertyGet`);
            return ctxt.value;
        }

        @AfterThrow(on.property.withAnnotations(AProperty))
        afterThrowProperty(ctxt: AfterThrowContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterThrowPropertyGet`);
            throw ctxt.error;
        }

        @Before(on.property.setter.withAnnotations(AProperty))
        beforePropertySet(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_beforePropertySet`);
        }

        @Around(on.property.setter.withAnnotations(AProperty))
        aroundPropertySet(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AroundPropertySet`);
            return ctxt.joinpoint();
        }

        @After(on.property.setter.withAnnotations(AProperty))
        afterPropertySet(ctxt: AfterContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterPropertySet`);
        }

        @AfterReturn(on.property.setter.withAnnotations(AProperty))
        afterReturnPropertySet(ctxt: AfterReturnContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterReturnPropertySet`);
        }

        @AfterThrow(on.property.setter.withAnnotations(AProperty))
        afterThrowPropertySet(ctxt: AfterThrowContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterThrowPropertySet`);
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
                'B_compileClass',
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
                'A_beforePropertyGet',
                'B_beforePropertyGet',
                'B_AroundPropertyGet',
                'A_AroundPropertyGet',
                'B_compilePropertyGet',
                'A_AfterReturnPropertyGet',
                'B_AfterReturnPropertyGet',
                'A_AfterPropertyGet',
                'B_AfterPropertyGet',
                // 'A_AfterThrowPropertyGet',
                // 'B_AfterThrowPropertyGet',
            );

            expect(labels).toEqual(expectedLabels);
            a.labels = [];

            expectedLabels.push(
                'A_beforePropertySet',
                'B_beforePropertySet',
                'B_AroundPropertySet',
                'A_AroundPropertySet',
                'B_compilePropertySet',
                'A_AfterReturnPropertySet',
                'B_AfterReturnPropertySet',
                'A_AfterPropertySet',
                'B_AfterPropertySet',
                // 'A_AfterThrowPropertySet',
                // 'B_AfterThrowPropertySet',
            );

            expect(labels).toEqual(expectedLabels);
        });
    });
});
