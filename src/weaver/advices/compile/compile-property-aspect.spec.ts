import { Aspect } from '../../types';
import { setWeaver } from '../../../index';
import { AdviceType, PropertyCompileAdvice } from '../types';
import { Compile } from './compile.decorator';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { AdviceContext } from '../advice-context';
import { AdviceTarget } from '../../../annotation/target/advice-target';
import { pc } from '../pointcut';
import { AnnotationFactory } from '../../../annotation/factory/factory';
import { WeavingError } from '../../weaving-error';

const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
    return;
});
const BProperty = new AnnotationFactory('tests').create(function BProperty(): PropertyDecorator {
    return;
});

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let compileAdvice: PropertyCompileAdvice<any> = target => {
    throw new Error('should configure compileAdvice');
};

describe('given a property configured with some annotation aspect', () => {
    describe('that leverage "compile" pointcut', () => {
        let target: AdviceTarget<any, AdviceType>;
        let instance: any;
        beforeEach(() => {
            class CompileAspect extends Aspect {
                id = 'APropertyLabel';

                @Compile(pc.property.annotations(AProperty))
                apply(ctxt: AdviceContext<any, AdviceType.PROPERTY>): any {
                    expect(this).toEqual(jasmine.any(CompileAspect));

                    return compileAdvice(ctxt);
                }
            }

            compileAdvice = jasmine
                .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                })
                .and.callThrough();

            setupWeaver(new CompileAspect());
        });

        it('should call the aspect upon compilation of annotated property', () => {
            class A {
                @AProperty()
                labels: string[];
            }
            expect(compileAdvice).toHaveBeenCalled();
        });

        it('should pass annotation target', () => {
            class A {
                @AProperty()
                labels: string[];
            }
            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
        });

        it('should not pass context instance', () => {
            class A {
                @AProperty()
                labels: string[];
            }
            expect(instance).toBeUndefined();
        });

        describe('when the advice returns a new property descriptor', () => {
            describe('and the descriptor is invalid', () => {
                beforeEach(() => {
                    compileAdvice = function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                        return ({
                            get: '',
                        } as any) as PropertyDescriptor;
                    };
                });

                it('should throw an error', () => {
                    expect(() => {
                        class X {
                            @AProperty()
                            labels: string[];
                        }
                    }).toThrow(new TypeError('Getter must be a function: '));
                });
            });

            describe('that sets "value = any"', () => {
                let a: Labeled;
                beforeEach(() => {
                    compileAdvice = function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                        return {
                            value: ['propAspect'],
                        };
                    };
                    class A implements Labeled {
                        @AProperty()
                        labels?: string[];
                    }
                    a = new A();
                });
                it('should use the new property', () => {
                    expect(a.labels).toEqual(['propAspect']);
                });

                it('should disallow setting the value', () => {
                    expect(() => {
                        a.labels = [];
                    }).toThrow(new Error('Cannot set property labels of #<A> which has only a getter'));
                });
            });

            describe('that sets "get = () => any"', () => {
                let a: Labeled;

                beforeEach(() => {
                    compileAdvice = function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                        return {
                            get: () => ['propAspect'],
                        };
                    };

                    class A implements Labeled {
                        @AProperty()
                        labels?: string[];
                    }
                    a = new A();
                });
                it('should use the new property', () => {
                    expect(a.labels).toEqual(['propAspect']);
                });

                it('should disallow setting the value', () => {
                    expect(() => {
                        a.labels = [];
                    }).toThrow(new Error('Cannot set property labels of #<A> which has only a getter'));
                });
            });

            describe('that sets "get = () => any" along with set = () => any', () => {
                let a: Labeled;
                beforeEach(() => {
                    compileAdvice = function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                        let val = ['propAspect'];
                        return {
                            get: () => val,
                            set: _val => (val = _val),
                        };
                    };

                    class A implements Labeled {
                        @AProperty()
                        labels?: string[];
                    }

                    a = new A();
                });

                it('should allow getting the property', () => {
                    expect(a.labels).toEqual(['propAspect']);
                });

                it('should allow setting the property', () => {
                    a.labels = ['newProp'];
                    expect(a.labels).toEqual(['newProp']);
                });
            });
        });

        describe('and specify property setter pointcut', () => {
            it('should throw an error', () => {
                expect(() => {
                    class BadAspect extends Aspect {
                        @Compile(pc.property.setter.annotations(AProperty))
                        apply() {}
                    }
                }).toThrow(
                    new WeavingError(
                        'Advice "@Compile(@AProperty) BadAspect.apply()" cannot be applied on property setter',
                    ),
                );
            });
        });
    });
});
