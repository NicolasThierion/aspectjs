import { Aspect } from '../../types';
import { setWeaver } from '../../../index';
import { AdviceType, PropertyCompileAdvice } from '../types';
import { Compile } from './compile.decorator';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { AdviceContext } from '../advice-context';
import { AnnotationTarget } from '../../../annotation/target/annotation-target';
import { pc } from '../pointcut';
import { AProperty } from '../after/after-property-aspect.spec';

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
        let target: AnnotationTarget<any, AdviceType>;
        let instance: any;
        beforeEach(() => {
            class CompileAspect extends Aspect {
                id = 'APropertyLabel';

                @Compile(pc.property.getter.annotations(AProperty))
                apply(ctxt: AdviceContext<any, AdviceType.PROPERTY>): any {
                    return compileAdvice(ctxt);
                }
            }

            compileAdvice = jasmine
                .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                    target = ctxt.annotation.target;
                    instance = (ctxt as any).instance;
                })
                .and.callThrough();

            setupWeaver(new CompileAspect());
        });

        it('should call the aspect upon compilation of annotated class', () => {
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

            // xdescribe('with "writable = false"', () => {});
            // it('should use the new property', () => {
            //     class A implements Labeled {
            //         @AProperty()
            //         labels?: string[];
            //     }
            //
            //     const a = new A();
            //     expect(ctor).toHaveBeenCalled();
            //     expect(a.labels).toEqual(['replacedCtor']);
            // });
        });
    });
});
