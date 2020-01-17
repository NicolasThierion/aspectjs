import { Aspect } from '../../types';
import { setWeaver } from '../../../index';
import { AdviceType } from '../types';
import { AfterThrowContext, CompileContext } from '../advice-context';
import { AClass } from '../../../tests/a';
import { AfterThrow } from './after-throw.decorator';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { pc } from '../pointcut';
import { AnnotationFactory } from '../../../annotation/factory/factory';
import { Compile } from '../compile/compile.decorator';
import Spy = jasmine.Spy;

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
    return;
});

class PropertyThrowAspect extends Aspect {
    id = 'PropertyThrow';

    @Compile(pc.property.annotations(AProperty))
    compile(ctxt: CompileContext<any, AdviceType.PROPERTY>): PropertyDescriptor {
        return {
            get() {
                throw new Error('expected');
            },
            set(val) {
                Reflect.defineMetadata(ctxt.annotation.target.propertyKey, val, this);
            },
        };
    }
}

class AfterThrowAspect extends Aspect {
    id = 'APropertyLabel';

    @AfterThrow(pc.property.annotations(AProperty))
    afterThrow(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>, error: Error): void {
        afterThrowAdviceSpy(ctxt, error);
        return Reflect.getOwnMetadata(ctxt.annotation.target.propertyKey, ctxt.instance);
    }
}

let afterThrowAdviceSpy: Spy;
let a: Labeled;
describe('given a property configured with some annotation aspect', () => {
    beforeEach(() => {
        afterThrowAdviceSpy = jasmine.createSpy('afterThrowAdvice', function() {}).and.callThrough();
    });
    describe('that leverage "afterThrow" pointcut', () => {
        describe('getting this property', () => {
            describe('with a descriptor that do not throws', () => {
                beforeEach(() => {
                    setupWeaver(new AfterThrowAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[] = [];
                    }

                    a = new A();
                });

                it('should not call the aspect', () => {
                    expect(afterThrowAdviceSpy).not.toHaveBeenCalled();
                });

                it('should return the original value', () => {
                    expect(a.labels).toEqual([]);
                });
            });

            describe('with a descriptor that throws', () => {
                beforeEach(() => {
                    setupWeaver(new AfterThrowAspect(), new PropertyThrowAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[] = [];
                    }

                    a = new A();

                    afterThrowAdviceSpy = jasmine.createSpy(
                        'afterThrowAdviceSpy',
                        (ctxt: AfterThrowContext<any, any>, error: Error) => {},
                    );
                });

                it('should call the aspect', () => {
                    try {
                        console.log(a.labels);
                    } catch (e) {}
                    expect(afterThrowAdviceSpy).toHaveBeenCalled();
                });

                describe('when the aspect swallows the exception', () => {
                    it('should not throw', () => {
                        expect(() => {
                            expect(a.labels).toEqual([]);
                        }).not.toThrow();
                    });
                });
            });

            describe('and the aspect returns a new value', () => {
                it('should use the returned value', () => {
                    class ReturnNewValueAspect extends Aspect {
                        id = 'APropertyLabel';

                        @AfterThrow(pc.property.annotations(AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>, error: Error): any {
                            return ['newValue'];
                        }
                    }

                    setupWeaver(new PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }
                    const a = new A();
                    expect(a.labels).toEqual(['newValue']);
                });
            });

            describe('and the aspect set a new ctxt.value', () => {
                it('should use the returned value', () => {
                    class ReturnNewValueAspect extends Aspect {
                        id = 'APropertyLabel';

                        @AfterThrow(pc.property.annotations(AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>, error: Error): void {
                            ctxt.value = ['newValue'];
                        }
                    }

                    setupWeaver(new PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }
                    const a = new A();
                    expect(a.labels).toEqual(['newValue']);
                });
            });
        });
    });
});
