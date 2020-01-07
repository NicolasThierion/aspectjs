import { Aspect } from '../../types';
import { Annotation, ClassAnnotation, setWeaver } from '../../../index';
import { CompileAdvice } from '../types';
import { AClass } from '../../../tests/a';
import { Compile } from './compile.decorator';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { AdviceContext } from '../advice-context';
import { AnnotationTarget } from '../../../annotation/target/annotation-target';
import { pc } from '../pointcut';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let compileAdvice: CompileAdvice<any> = target => {
    throw new Error('should configure compileAdvice');
};

describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "compile" pointcut', () => {
        let target: AnnotationTarget<any, Annotation>;
        let instance: any;
        beforeEach(() => {
            class CompileAspect extends Aspect {
                name = 'AClassLabel';

                @Compile(pc.class.annotations(AClass))
                apply(ctxt: AdviceContext<any, ClassAnnotation>): void {
                    return compileAdvice(ctxt);
                }
            }

            compileAdvice = jasmine
                .createSpy('compileAdvice', function(ctxt: AdviceContext<any, ClassAnnotation>) {
                    target = ctxt.annotation.target;
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
    });
});
