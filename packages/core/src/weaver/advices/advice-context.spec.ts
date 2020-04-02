import { setWeaver, Weaver } from '../weaver';
import { LoadTimeWeaver } from '../load-time/load-time-weaver';
import { Aspect } from './aspect';
import { Compile } from './compile/compile.decorator';
import { on } from './pointcut';
import { AClass, BClass } from '../../../tests/helpers';
import { CompileContext } from './compile/compile-context';
import { AnnotationType } from '../../annotation/annotation.types';

xdescribe('AdviceContext', () => {
    let weaver: Weaver;
    beforeEach(() => {
        setWeaver((weaver = new LoadTimeWeaver()));
    });

    describe('".data" attribute', () => {
        let data: any;
        beforeEach(() => {
            data = null;

            @Aspect()
            class AspectA {
                @Compile(on.class.withAnnotations(AClass), { priority: 1 })
                compileA(ctxt: CompileContext<any, AnnotationType.CLASS>) {
                    data = { ...data, ...ctxt.data };
                    ctxt.data.advices = ctxt.data.advices ?? [];
                    ctxt.data.advices.push('compile1');
                }
            }
            @Aspect()
            class AspectB {
                @Compile(on.class.withAnnotations(BClass), { priority: 2 })
                compileB(ctxt: CompileContext<any, AnnotationType.CLASS>) {
                    data = { ...data, ...ctxt.data };
                    ctxt.data.advices = ctxt.data.advices ?? [];
                    ctxt.data.advices.push('compile2');
                }
            }

            weaver.enable(new AspectA(), new AspectB());
        });

        describe('between two @Compile advices', function() {
            describe('when the advices are applied on the same classes', () => {
                it('should be shared across the two advices', () => {
                    @AClass()
                    @BClass()
                    class Test {}

                    new Test();
                    expect(data.advices).toEqual(['compile2', 'compile1']);
                });
            });

            // describe('when the advices are applied on two differenc classes symbol', () => {
            //     it('should be shared across the two advices', () => {
            //         @AClass()
            //         @BClass()
            //         class Test {}
            //
            //         new Test();
            //         expect(data.advices).toEqual(['compile2', 'compile1']);
            //     });
            // });
        });
    });
});
