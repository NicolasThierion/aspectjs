import { Aspect } from '../../types';
import { Annotation, ClassAnnotation, setWeaver } from '../../../index';
import { AdviceType, CompileAdvice } from '../types';
import { AClass } from '../../../tests/a';
import { Compile } from './compile.decorator';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { AdviceContext } from '../advice-context';
import { AdviceTarget } from '../../../annotation/target/advice-target';
import { pc } from '../pointcut';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let compileAdvice: CompileAdvice<any, AdviceType.CLASS> = target => {
    throw new Error('should configure compileAdvice');
};

describe('given a class configured with some annotation aspect', () => {
    describe('that leverage "compile" pointcut', () => {
        let target: AdviceTarget<any, AdviceType>;
        let instance: any;
        beforeEach(() => {
            class CompileAspect extends Aspect {
                id = 'AClassLabel';

                @Compile(pc.class.annotations(AClass))
                apply(ctxt: AdviceContext<any, AdviceType.CLASS>): any {
                    expect(this).toEqual(jasmine.any(CompileAspect));

                    return compileAdvice(ctxt);
                }
            }

            compileAdvice = jasmine
                .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AdviceType.CLASS>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                })
                .and.callThrough();

            setupWeaver(new CompileAspect());
        });

        it('should call the aspect upon compilation of annotated class', () => {
            @AClass()
            class A {}
            expect(compileAdvice).toHaveBeenCalled();
        });

        it('should pass annotation target', () => {
            @AClass()
            class A {}
            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
        });

        it('should not pass context instance', () => {
            @AClass()
            class A {}
            expect(instance).toBeUndefined();
        });

        describe('when the advice returns a new constructor', () => {
            let ctor: Function;
            beforeEach(() => {
                ctor = jasmine.createSpy('ctor');
                compileAdvice = function(ctxt: AdviceContext<any, AdviceType.CLASS>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;

                    return function() {
                        ctor();
                        this.labels = ['replacedCtor'];
                    };
                };
            });
            it('should use the new constructor', () => {
                @AClass()
                class A implements Labeled {
                    labels?: string[];
                }

                const a = new A();
                expect(ctor).toHaveBeenCalled();
                expect(a.labels).toEqual(['replacedCtor']);
            });
        });
    });
});
