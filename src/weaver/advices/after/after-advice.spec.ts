import { Aspect } from '../../types';
import { AdviceType } from '../types';
import { After } from './after.decorator';
import { AClass } from '../../../tests/a';
import { AdviceContext, AfterContext } from '../advice-context';
import { on } from '../pointcut';
import { WeavingError } from '../../weaving-error';
import Spy = jasmine.Spy;
import { AProperty, Labeled, setupWeaver } from '../../../tests/helpers';

let afterAdvice: Spy;

describe('@After advice', () => {
    describe('applied on a class', () => {
        beforeEach(() => {
            class AfterAspect extends Aspect {
                id = 'AClassLabel';

                @After(on.class.annotations(AClass))
                apply(ctxt: AdviceContext<any, AdviceType.CLASS>): void {
                    expect(this).toEqual(jasmine.any(AfterAspect));
                    afterAdvice(ctxt);
                }
            }

            afterAdvice = jasmine
                .createSpy('afterAdvice', function(ctxt) {
                    ctxt.instance.labels = ctxt.instance.labels ?? [];
                    ctxt.instance.labels.push('AClass');
                })
                .and.callThrough();

            setupWeaver(new AfterAspect());
        });

        describe('when advice returns a value', () => {
            it('should throw an error', () => {
                class BadAfterAspect extends Aspect {
                    id = 'AClassLabel';

                    @After(on.class.annotations(AClass))
                    apply(ctxt: AdviceContext<any, AdviceType.CLASS>) {
                        return function() {};
                    }
                }

                setupWeaver(new BadAfterAspect());

                expect(() => {
                    @AClass()
                    class X {}

                    new X();
                }).toThrow(
                    new WeavingError('Returning from advice "@After(@AClass) BadAfterAspect.apply()" is not supported'),
                );
            });
        });

        describe('creating an instance of this class', () => {
            it('should invoke the aspect', () => {
                @AClass()
                class A implements Labeled {}

                const instance = new A() as Labeled;
                const labels = instance.labels;
                expect(labels).toBeDefined();
                expect(labels).toEqual(['AClass']);
            });

            it('should produce a class of the same class instance', () => {
                @AClass()
                class A implements Labeled {}

                const instance = new A();
                expect(instance instanceof A).toBeTrue();
            });
            it('should call the original constructor after the aspect', () => {
                @AClass()
                class A implements Labeled {
                    labels: string[];
                    constructor() {
                        this.labels = (this.labels ?? []).concat('ctor');
                    }
                }

                const labels = (new A() as Labeled).labels;
                expect(labels).toBeDefined();
                expect(labels).toEqual(['ctor', 'AClass']);
            });

            it('should pass down the constructor argument', () => {
                @AClass()
                class A implements Labeled {
                    labels: string[];
                    constructor(lbl: string) {
                        this.labels = (this.labels ?? []).concat(lbl);
                    }
                }

                const labels = (new A('lbl') as Labeled).labels;
                expect(labels).toBeDefined();
                expect(labels).toEqual(['lbl', 'AClass']);
            });

            describe('when the constructor throws', () => {
                it('should call the "after" advice', () => {
                    @AClass()
                    class A {
                        constructor() {
                            throw new Error('');
                        }
                    }
                    expect(afterAdvice).not.toHaveBeenCalled();

                    try {
                        new A();
                    } catch (e) {}
                    expect(afterAdvice).toHaveBeenCalled();
                });
            });
        });
    });

    describe('applied on a property', () => {
        beforeEach(() => {
            class AfterAspect extends Aspect {
                id = 'APropertyLabel';

                @After(on.property.annotations(AProperty))
                apply(ctxt: AdviceContext<any, AdviceType.PROPERTY>): void {
                    expect(this).toEqual(jasmine.any(AfterAspect));

                    afterAdvice(ctxt);
                }
            }

            afterAdvice = jasmine
                .createSpy('afterAdvice', function(ctxt: AfterContext<any, AdviceType.PROPERTY>) {})
                .and.callThrough();

            setupWeaver(new AfterAspect());
        });

        describe('getting the annotated property', () => {
            it('should invoke the aspect', () => {
                class A implements Labeled {
                    @AProperty()
                    labels?: string[];
                }

                const instance = new A() as Labeled;
                const labels = instance.labels;

                expect(afterAdvice).toHaveBeenCalled();
            });

            it("should return the original property's value", () => {
                class A implements Labeled {
                    @AProperty()
                    labels = ['a'];
                }

                const instance = new A() as Labeled;
                const labels = instance.labels;

                expect(labels).toEqual(['a']);
            });
        });

        describe('when the advice returns a value', () => {
            it('should throw an error', () => {
                class BadAfterAspect extends Aspect {
                    id = 'APropertyLabel';

                    @After(on.property.annotations(AProperty))
                    apply(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                        return Object.getOwnPropertyDescriptor({ test: 'test' }, 'test');
                    }
                }

                setupWeaver(new BadAfterAspect());
                expect(() => {
                    class X {
                        @AProperty()
                        someProp: string;
                    }

                    const prop = new X().someProp;
                }).toThrow(
                    new WeavingError(
                        'Returning from advice "@After(@AProperty) BadAfterAspect.apply()" is not supported',
                    ),
                );
            });
        });
    });
});
