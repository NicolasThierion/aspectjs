import { After } from './after.decorator';
import { AdviceContext, AfterContext } from '../advice-context';
import { on } from '../pointcut';
import { WeavingError } from '../../weaving-error';
import Spy = jasmine.Spy;
import { AClass, AMethod, AProperty, Labeled, setupWeaver } from '../../../../tests/helpers';
import { Aspect } from '../aspect';
import { AnnotationType } from '../../../annotation/annotation.types';

let afterAdvice: Spy;

describe('@After advice', () => {
    describe('applied on a class', () => {
        beforeEach(() => {
            @Aspect('AClassLabel')
            class AfterAspect {
                @After(on.class.withAnnotations(AClass))
                apply(ctxt: AdviceContext<any, AnnotationType.CLASS>): void {
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
                @Aspect('AClassLabel')
                class BadAfterAspect {
                    @After(on.class.withAnnotations(AClass))
                    apply(ctxt: AdviceContext<any, AnnotationType.CLASS>) {
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
            @Aspect('APropertyLabel')
            class AfterAspect {
                @After(on.property.withAnnotations(AProperty))
                apply(ctxt: AdviceContext<any, AnnotationType.PROPERTY>): void {
                    expect(this).toEqual(jasmine.any(AfterAspect));

                    afterAdvice(ctxt);
                }
            }

            afterAdvice = jasmine
                .createSpy('afterAdvice', function(ctxt: AfterContext<any, AnnotationType.PROPERTY>) {})
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
                @Aspect('APropertyLabel')
                class BadAfterAspect {
                    @After(on.property.setter.withAnnotations(AProperty))
                    apply(ctxt: AdviceContext<any, AnnotationType.PROPERTY>) {
                        return Object.getOwnPropertyDescriptor({ test: 'test' }, 'test');
                    }
                }

                setupWeaver(new BadAfterAspect());
                expect(() => {
                    class X {
                        @AProperty()
                        someProp: string;
                    }

                    new X().someProp = '';
                }).toThrow(
                    new WeavingError(
                        'Returning from advice "@After(@AProperty) BadAfterAspect.apply()" is not supported',
                    ),
                );
            });
        });
    });

    describe('applied on a method', () => {
        let a: Labeled;
        beforeEach(() => {
            @Aspect('AMethod')
            class AfterAspect {
                @After(on.method.withAnnotations(AMethod))
                apply(ctxt: AdviceContext<any, AnnotationType.METHOD>): void {
                    expect(this).toEqual(jasmine.any(AfterAspect));

                    afterAdvice(ctxt);
                }
            }

            afterAdvice = jasmine
                .createSpy('afterAdvice', function(ctxt: AfterContext<any, AnnotationType.PROPERTY>) {})
                .and.callThrough();

            setupWeaver(new AfterAspect());

            class A implements Labeled {
                @AMethod()
                addLabel() {
                    return ['value'];
                }
            }

            a = new A() as Labeled;
        });

        describe('calling the method', () => {
            it('should invoke the aspect', () => {
                expect(afterAdvice).not.toHaveBeenCalled();
                a.addLabel();
                expect(afterAdvice).toHaveBeenCalled();
            });

            it("should return the original property's value", () => {
                expect(a.addLabel()).toEqual(['value']);
            });
        });

        describe('when the advice returns a value', () => {
            it('should throw an error', () => {
                @Aspect('AMethod')
                class BadAfterAspect {
                    @After(on.method.withAnnotations(AMethod))
                    apply(ctxt: AdviceContext<any, AnnotationType.PROPERTY>) {
                        return Object.getOwnPropertyDescriptor({ test: 'test' }, 'test');
                    }
                }

                setupWeaver(new BadAfterAspect());
                expect(() => {
                    class X implements Labeled {
                        @AMethod()
                        addLabel() {}
                    }

                    const prop = new X().addLabel();
                }).toThrow(
                    new WeavingError(
                        'Returning from advice "@After(@AMethod) BadAfterAspect.apply()" is not supported',
                    ),
                );
            });
        });
    });

    xdescribe('applied on a method parameter', () => {
        let a: Labeled;
        beforeEach(() => {
            @Aspect('AMethod')
            class AfterAspect {
                @After(on.method.withAnnotations(AMethod))
                apply(ctxt: AdviceContext<any, AnnotationType.METHOD>): void {
                    expect(this).toEqual(jasmine.any(AfterAspect));

                    afterAdvice(ctxt);
                }
            }

            afterAdvice = jasmine
                .createSpy('afterAdvice', function(ctxt: AfterContext<any, AnnotationType.PROPERTY>) {})
                .and.callThrough();

            setupWeaver(new AfterAspect());

            class A implements Labeled {
                @AMethod()
                addLabel() {
                    return ['value'];
                }
            }

            a = new A() as Labeled;
        });

        describe('calling the method', () => {
            it('should invoke the aspect', () => {
                expect(afterAdvice).not.toHaveBeenCalled();
                a.addLabel();
                expect(afterAdvice).toHaveBeenCalled();
            });

            it("should return the original property's value", () => {
                expect(a.addLabel()).toEqual(['value']);
            });
        });

        describe('when the advice returns a value', () => {
            it('should throw an error', () => {
                @Aspect('AMethod')
                class BadAfterAspect {
                    @After(on.method.withAnnotations(AMethod))
                    apply(ctxt: AdviceContext<any, AnnotationType.PROPERTY>) {
                        return Object.getOwnPropertyDescriptor({ test: 'test' }, 'test');
                    }
                }

                setupWeaver(new BadAfterAspect());
                expect(() => {
                    class X implements Labeled {
                        @AMethod()
                        addLabel() {}
                    }

                    const prop = new X().addLabel();
                }).toThrow(
                    new WeavingError(
                        'Returning from advice "@After(@AMethod) BadAfterAspect.apply()" is not supported',
                    ),
                );
            });
        });
    });
});
