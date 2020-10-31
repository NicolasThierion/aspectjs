import { AdviceContext, BeforeContext } from '../advice-context';
import { Before } from './before.decorator';
import { on } from '../pointcut';
import { AClass, AMethod, AParameter, AProperty, Labeled, setupWeaver } from '../../../testing/src/helpers';
import { Aspect } from '../aspect';
import { AdviceType } from '../../annotation/annotation.types';
import Spy = jasmine.Spy;

describe('@Before advice', () => {
    let advice: Spy;
    let aspectClass: any;
    beforeEach(() => {
        advice = jasmine.createSpy('advice');
    });

    describe('applied on a class', () => {
        const ctor = jasmine.createSpy('ctor');
        let thisInstance: any;

        beforeEach(() => {
            @Aspect('AClassLabel')
            class AAspect {
                @Before(on.class.withAnnotations(AClass))
                applyBefore(ctxt: BeforeContext<any, AdviceType.CLASS>): void {
                    thisInstance = ctxt.instance;

                    advice.bind(this)(ctxt);
                }
            }
            aspectClass = AAspect;

            setupWeaver(new AAspect());
        });
        it('should bind this to the aspect instance', () => {
            advice = jasmine.createSpy('advice').and.callFake(function () {
                expect(this).toEqual(jasmine.any(aspectClass));
            });

            @AClass()
            class A {}

            new A();
            expect(advice).toHaveBeenCalled();
        });

        it('should call the aspect before the constructor', () => {
            @AClass()
            class A {
                constructor() {
                    ctor();
                }
            }

            new A();
            expect(advice).toHaveBeenCalled();
            expect(ctor).toHaveBeenCalled();
            expect(advice).toHaveBeenCalledBefore(ctor);
        });

        it('should have a "null" context.instance', () => {
            @AClass()
            class A {
                constructor() {}
            }
            new A();

            expect(thisInstance).toBeNull();
        });
    });

    describe('applied on a property', () => {
        let a: Labeled;

        beforeEach(() => {
            @Aspect('AClassLabel')
            class AAspect {
                @Before(on.property.withAnnotations(AProperty))
                applyBefore(ctxt: AdviceContext<any, AdviceType.PROPERTY>): void {
                    advice.bind(this)(ctxt);
                }
            }
            aspectClass = AAspect;

            setupWeaver(new AAspect());

            class A implements Labeled {
                @AProperty()
                labels: string[] = [];
            }

            a = new A();
        });

        it('should bind this to the aspect instance', () => {
            advice = jasmine.createSpy('advice').and.callFake(function () {
                expect(this).toEqual(jasmine.any(aspectClass));
            });
            const labels = a.labels;

            expect(advice).toHaveBeenCalled();
        });

        it('should call the aspect before the property is get', () => {
            expect(advice).not.toHaveBeenCalled();
            const labels = a.labels;
            expect(advice).toHaveBeenCalled();
        });

        it('should have a non null context.instance', () => {
            let thisInstance: any;
            advice = jasmine.createSpy('beforeAdvice').and.callFake((ctxt: BeforeContext<any, any>) => {
                thisInstance = ctxt.instance;
            });
            const labels = a.labels;
            expect(thisInstance).toEqual(a);
        });
    });

    describe('applied on a property setter', () => {
        let a: Labeled;

        beforeEach(() => {
            @Aspect('AClassLabel')
            class AAspect {
                @Before(on.property.setter.withAnnotations(AProperty))
                applyBefore(ctxt: AdviceContext<any, AdviceType.PROPERTY>): void {
                    advice.bind(this)(ctxt);
                }
            }
            aspectClass = AAspect;

            setupWeaver(new AAspect());

            class A implements Labeled {
                @AProperty()
                labels: string[] = [];
            }

            a = new A();
            advice = jasmine.createSpy('beforeAdvice').and.callFake((ctxt: BeforeContext<any, any>) => {});
        });

        it('should bind this to the aspect instance', () => {
            advice = jasmine.createSpy('advice').and.callFake(function () {
                expect(this).toEqual(jasmine.any(aspectClass));
            });
            a.labels = ['set'];

            expect(advice).toHaveBeenCalled();
        });

        it('should call the aspect before the property is set', () => {
            expect(advice).not.toHaveBeenCalled();
            a.labels = ['set'];
            expect(advice).toHaveBeenCalled();
        });

        it('should have a non null context.instance', () => {
            let thisInstance: any;
            advice = jasmine.createSpy('beforeAdvice').and.callFake((ctxt: BeforeContext<any, any>) => {
                thisInstance = ctxt.instance;
            });
            a.labels = [];
            expect(thisInstance).toEqual(a);
        });
    });

    describe('applied on a method', () => {
        let a: any;

        beforeEach(() => {
            @Aspect('AClassLabel')
            class AAspect {
                @Before(on.method.withAnnotations(AMethod))
                applyBefore(ctxt: AdviceContext<any, AdviceType.METHOD>): void {
                    advice.bind(this)(ctxt);
                }
            }

            aspectClass = AAspect;
            setupWeaver(new AAspect());

            class A {
                @AMethod()
                addLabel(): any {}
            }

            a = new A();
            advice = jasmine
                .createSpy('beforeAdvice')
                .and.callFake((ctxt: BeforeContext<any, AdviceType.METHOD>) => {});
        });

        it('should bind this to the aspect instance', () => {
            advice = jasmine.createSpy('advice').and.callFake(function () {
                expect(this).toEqual(jasmine.any(aspectClass));
            });
            a.addLabel();

            expect(advice).toHaveBeenCalled();
        });

        it('should call the aspect before the method is called', () => {
            expect(advice).not.toHaveBeenCalled();
            a.addLabel();
            expect(advice).toHaveBeenCalled();
        });

        it('should have a non null context.instance', () => {
            let thisInstance: any;
            advice = jasmine.createSpy('beforeAdvice').and.callFake((ctxt: BeforeContext<any, any>) => {
                thisInstance = ctxt.instance;
            });
            a.addLabel();
            expect(thisInstance).toEqual(a);
        });
    });

    describe('applied on a method parameter', () => {
        let a: Labeled;
        let methodSpy: jasmine.Spy;
        beforeEach(() => {
            @Aspect()
            class AAspect {
                @Before(on.parameter.withAnnotations(AParameter))
                applyBefore(ctxt: AdviceContext<any, AdviceType.PARAMETER>): void {
                    advice.bind(this)(ctxt);
                }
            }
            aspectClass = AAspect;
            methodSpy = jasmine.createSpy('methodSpy');
            setupWeaver(new AAspect());

            class A {
                addLabel(@AParameter() param: any): any {
                    methodSpy();
                }
            }

            a = new A();
            advice = jasmine
                .createSpy('beforeAdvice')
                .and.callFake((ctxt: BeforeContext<any, AdviceType.METHOD>) => {});
        });

        it('should bind "this" to the aspect instance', () => {
            advice = jasmine
                .createSpy('beforeAdvice')
                .and.callFake(function (ctxt: BeforeContext<any, AdviceType.METHOD>) {
                    expect(this).toEqual(jasmine.any(aspectClass));
                });

            a.addLabel('a');
        });

        it('should call the aspect before the method is called', () => {
            a.addLabel('a');
            expect(methodSpy).toHaveBeenCalled();
            expect(advice).toHaveBeenCalled();
            expect(advice).toHaveBeenCalledBefore(methodSpy);
        });

        it('should have a non null context.instance', () => {
            let thisInstance: any;
            advice = jasmine.createSpy('beforeAdvice').and.callFake((ctxt: BeforeContext<any, any>) => {
                thisInstance = ctxt.instance;
            });
            a.addLabel();
            expect(thisInstance).toEqual(a);
        });
    });
});
