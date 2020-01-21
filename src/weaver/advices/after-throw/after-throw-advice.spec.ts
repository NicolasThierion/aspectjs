import { Aspect } from '../../types';
import { AdviceType } from '../types';
import { AdviceContext, AfterThrowContext, CompileContext } from '../advice-context';
import { AClass } from '../../../tests/a';
import { AfterThrow } from './after-throw.decorator';
import { on } from '../pointcut';
import { AProperty, Labeled, setupWeaver } from '../../../tests/helpers';
import Spy = jasmine.Spy;
import { Compile } from '../compile/compile.decorator';
import { Mutable } from '../../../utils';

describe('@AfterThrow advice', () => {
    let afterThrowAdvice: Spy;
    beforeEach(() => {
        afterThrowAdvice = jasmine.createSpy('afterThrowAdvice', function() {}).and.callThrough();
    });

    describe('configured on some class', () => {
        beforeEach(() => {
            class AfterThrowAspect extends Aspect {
                id = 'AClassLabel';

                @AfterThrow(on.class.annotations(AClass))
                apply(ctxt: AfterThrowContext<any, AdviceType.CLASS>): void {
                    expect(this).toEqual(jasmine.any(AfterThrowAspect));

                    return afterThrowAdvice(ctxt);
                }
            }

            setupWeaver(new AfterThrowAspect());
        });

        describe('when an instance of this class is created', () => {
            describe('with a constructor that throws', () => {
                beforeEach(() => {
                    afterThrowAdvice = jasmine
                        .createSpy('afterThrowAdvice', function(ctxt: AfterThrowContext<Labeled, AdviceType.CLASS>) {
                            ctxt.instance.labels = ctxt.instance.labels ?? [];
                            ctxt.instance.labels.push('A');
                            throw ctxt.error;
                        })
                        .and.callThrough();
                });

                it('should call the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];
                            throw new Error('expected');
                        }
                    }

                    expect(() => {
                        new A('ctor');
                    }).toThrow();
                    expect(afterThrowAdvice).toHaveBeenCalled();
                });

                describe('when the aspect swallows the exception', () => {
                    beforeEach(() => {
                        afterThrowAdvice = jasmine
                            .createSpy('afterThrowAdvice', (ctxt: AfterThrowContext<Labeled, AdviceType.CLASS>) => {
                                ctxt.instance.labels = ctxt.instance.labels ?? [];
                                ctxt.instance.labels.push('A');
                            })
                            .and.callThrough();
                    });

                    it('should not throw', () => {
                        @AClass()
                        class A implements Labeled {
                            public labels: string[];
                            constructor(label: string) {
                                this.labels = [label];

                                throw new Error('expected');
                            }
                        }

                        let labels: string[];

                        expect(() => {
                            const a = new A('ctor');
                            labels = a.labels;
                        }).not.toThrow();
                        expect(afterThrowAdvice).toHaveBeenCalled();
                        expect(labels).toEqual(['A']);
                    });
                });
            });

            describe('and the aspect returns a new value', () => {
                beforeEach(() => {
                    afterThrowAdvice = jasmine
                        .createSpy('afterThrowAdvice', (ctxt: AdviceContext<Labeled, AdviceType.CLASS>) => {
                            return Object.assign(Object.create(ctxt.target.proto), {
                                labels: ['ABis'],
                            });
                        })
                        .and.callThrough();
                });

                it('should assign "this" instance to the returned value', () => {
                    @AClass()
                    class A implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];

                            throw new Error('expected');
                        }
                    }
                    const a = new A('test');
                    expect(a.labels).toEqual(['ABis']);
                });
            });

            describe('with a constructor that do not throws', () => {
                it('should call not the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];
                        }
                    }

                    expect(afterThrowAdvice).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe('applied on a property', () => {
        class PropertyThrowAspect extends Aspect {
            id = 'PropertyThrow';

            @Compile(on.property.annotations(AProperty))
            compile(ctxt: CompileContext<any, AdviceType.PROPERTY>): PropertyDescriptor {
                return {
                    get() {
                        throw new Error('expected');
                    },
                    set(val) {
                        Reflect.defineMetadata(ctxt.target.propertyKey, val, this);
                    },
                };
            }
        }

        class AfterThrowAspect extends Aspect {
            id = 'APropertyLabel';

            @AfterThrow(on.property.annotations(AProperty))
            afterThrow(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>, error: Error): void {
                afterThrowAdvice(ctxt, error);
                return Reflect.getOwnMetadata(ctxt.target.propertyKey, ctxt.instance);
            }
        }

        let a: Labeled;

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
                    expect(afterThrowAdvice).not.toHaveBeenCalled();
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

                    afterThrowAdvice = jasmine.createSpy(
                        'afterThrowAdviceSpy',
                        (ctxt: AfterThrowContext<any, any>, error: Error) => {},
                    );
                });

                it('should call the aspect', () => {
                    try {
                        console.log(a.labels);
                    } catch (e) {}
                    expect(afterThrowAdvice).toHaveBeenCalled();
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

                        @AfterThrow(on.property.annotations(AProperty))
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
                it('should throw an error', () => {
                    class ReturnNewValueAspect extends Aspect {
                        id = 'APropertyLabel';

                        @AfterThrow(on.property.annotations(AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>, error: Error): void {
                            (ctxt as Mutable<AfterThrowContext<any, AdviceType.PROPERTY>>).value = ['newValue'];
                        }
                    }

                    setupWeaver(new PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }
                    const a = new A();
                    expect(() => a.labels).toThrow(
                        new TypeError('Cannot add property value, object is not extensible'),
                    );
                });
            });

            describe('and the aspect do not return a value', () => {
                it('should throw an error', () => {
                    class ReturnNewValueAspect extends Aspect {
                        id = 'APropertyLabel';

                        @AfterThrow(on.property.annotations(AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>, error: Error): void {}
                    }

                    setupWeaver(new PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }
                    const a = new A();
                    expect(a.labels).toEqual(undefined);
                });
            });
        });
    });
});
