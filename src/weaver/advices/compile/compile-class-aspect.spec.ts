import { AnnotationTarget } from '../../../annotation/target/annotation-target';
import { Aspect } from '../../types';
import { Weaver } from '../../load-time/load-time-weaver';
import { ClassAnnotation, setWeaver } from '../../../index';
import { CompileAdvice } from '../types';
import { AClass } from '../../../tests/a';
import { Compile } from './compile.decorator';
import { assert } from '../../../utils';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new Weaver().enable(...aspects);
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
                apply(target: AnnotationTarget<any, ClassAnnotation>): void {
                    return compileAdvice(target);
                }
            }

            compileAdvice = jasmine
                .createSpy('compileAdvice', function(target: AnnotationTarget<any, ClassAnnotation>) {
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
