import { AdviceContext, CompileContext } from '../advice-context';
import { Aspect } from '../aspect';
import { Compile } from './compile.decorator';
import { on } from '../pointcut';
import { AClass, BClass } from '../../../../tests/helpers';
import { AnnotationType } from '../../../annotation/annotation.types';
import { setWeaver, Weaver } from '../../weaver';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { Before } from '../before/before.decorator';

describe('CompileContext', () => {
    let weaver: Weaver;
    let compileAAdvice = jasmine.createSpy('compileAAdvice');
    let compileBAdvice = jasmine.createSpy('compileBAdvice');
    let beforeAAdvice = jasmine.createSpy('beforeAAdvice');
    let beforeBAdvice = jasmine.createSpy('beforeBAdvice');
    beforeEach(() => {
        setWeaver((weaver = new LoadTimeWeaver()));
    });
    let classAspectA: any;
    let classAspectB: any;

    describe('on a class', () => {
        beforeEach(() => {
            compileAAdvice = jasmine.createSpy('compileAAdvice');
            compileBAdvice = jasmine.createSpy('compileBAdvice');
            beforeAAdvice = jasmine.createSpy('beforeAAdvice');
            beforeBAdvice = jasmine.createSpy('beforeBAdvice');
            @Aspect()
            class ClassAspectA {
                @Compile(on.class.withAnnotations(AClass), { priority: 10 })
                compileA(ctxt: CompileContext<any, AnnotationType.CLASS>) {
                    compileAAdvice(ctxt);
                }

                @Before(on.class.withAnnotations(AClass), { priority: 10 })
                beforeA(ctxt: CompileContext<any, AnnotationType.CLASS>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @Compile(on.class.withAnnotations(BClass), { priority: 9 })
                compileB(ctxt: CompileContext<any, AnnotationType.CLASS>) {
                    compileBAdvice(ctxt);
                }

                @Before(on.class.withAnnotations(BClass), { priority: 9 })
                beforeB(ctxt: CompileContext<any, AnnotationType.CLASS>) {
                    beforeBAdvice(ctxt);
                }
            }
            classAspectA = ClassAspectA;
            classAspectB = ClassAspectB;
            weaver.enable(new ClassAspectA(), new ClassAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string) {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                compileAAdvice.and.callFake(ctxt => pushData(ctxt, 'compileA'));
                compileBAdvice.and.callFake(ctxt => pushData(ctxt, 'compileB'));

                beforeAAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Compile advices on the ame class', () => {
                @AClass()
                @BClass()
                class Test {}

                expect(data.advices).toEqual(['compileA', 'compileB']);
            });

            it('should not shared across two @Compile advices on different classes', () => {
                @AClass()
                class Test1 {}

                expect(data.advices).toEqual(['compileA']);
                @BClass()
                class Test2 {}

                expect(data.advices).toEqual(['compileB']);
            });

            it('should be shared between a @Compile and a @Before advice on the same class', () => {
                @AClass()
                @BClass()
                class Test {}
                expect(data.advices).toEqual(['compileA', 'compileB']);
                new Test();
                expect(data.advices).toEqual(['compileA', 'compileB', 'beforeA', 'beforeB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                compileAAdvice.and.callFake((ctxt: CompileContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                @AClass()
                class Test {}

                expect(compileAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    compileAAdvice.and.callFake((ctxt: CompileContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    @AClass()
                    class Test {}

                    expect(compileAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    compileAAdvice.and.callFake((ctxt: CompileContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(classAspectB);
                    });

                    compileBAdvice.and.callFake((ctxt: CompileContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    @AClass()
                    @BClass()
                    class Test {}

                    expect(compileAAdvice).toHaveBeenCalled();
                    expect(compileBAdvice).toHaveBeenCalled();
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    compileAAdvice.and.callFake((ctxt: CompileContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    @BClass()
                    @AClass()
                    class Test {}

                    expect(compileAAdvice).toHaveBeenCalled();
                    expect(compileBAdvice).not.toHaveBeenCalled();
                });
            });
        });
    });
});
