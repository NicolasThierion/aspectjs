import { AnnotationTarget } from '../../../annotation/target/annotation-target';
import { Aspect } from '../../types';
import { ClassAnnotation, setWeaver } from '../../../index';
import { CompileAdvice } from '../types';
import { AClass } from '../../../tests/a';
import { Compile } from './compile.decorator';
import { assert } from '../../../utils';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { AdviceContext } from '../advice-context';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let compileAdvice: CompileAdvice<any> = target => {
    throw new Error('should configure setupAdvice');
};

xdescribe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "compile" pointcut', () => {
        beforeEach(() => {
            class CompileAspect extends Aspect {
                name = 'AClassLabel';

                @Compile(AClass)
                apply(ctxt: AdviceContext<any, ClassAnnotation>): void {
                    return compileAdvice(ctxt);
                }
            }

            compileAdvice = jasmine
                .createSpy('compileAdvice', function(ctxt: AdviceContext<any, ClassAnnotation>) {
                    assert(false, 'not implemented');
                })
                .and.callThrough();

            setupWeaver(new CompileAspect());
        });

        it('should call the aspect uppon compilation of annotated class', () => {
            @AClass()
            class A {}
            expect(compileAdvice).toHaveBeenCalled();
        });
    });
});
