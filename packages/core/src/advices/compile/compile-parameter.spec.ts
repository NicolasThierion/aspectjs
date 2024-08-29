import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { AdviceError, PointcutType } from '../../public_api';
import { WeaverModule } from '../../weaver/weaver.module';
import { Compile } from './compile.annotation';
import { CompileContext } from './compile.context';
/* eslint-disable @typescript-eslint/no-unused-vars */

describe('parameter advice', () => {
  let compileAdviceA: ReturnType<typeof jest.fn>;
  let compileAdviceB: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  let methodImpl: any;
  const AParameter = new AnnotationFactory('test').create(
    AnnotationType.PARAMETER,
    'AParameter',
  );
  const BParameter = new AnnotationFactory('test').create(
    AnnotationType.PARAMETER,
    'BParameter',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);

    compileAdviceA = jest.fn((c: CompileContext) => {});
    compileAdviceB = jest.fn((c: CompileContext) => {});
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('AClassLabel')
    class AAspect {
      @Compile(on.parameters.withAnnotations(...aanotations))
      applyCompile(
        ctxt: CompileContext<PointcutType.PARAMETER>,
        ...args: unknown[]
      ): void {
        return compileAdviceA.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BClassLabel')
    class BAspect {
      @Compile(on.parameters.withAnnotations(...bannotations))
      applyCompile(
        ctxt: CompileContext<PointcutType.PARAMETER>,
        ...args: unknown[]
      ): void {
        return compileAdviceB.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
    methodImpl = jest.fn();
  }

  describe('on pointcut @Compile(on.parameters.withAnnotations()', () => {
    beforeEach(() => setupAspects());

    it('calls through each matching advice once', () => {
      compileAdviceA = jest.fn(function (this: any, _ctxt: CompileContext) {});
      compileAdviceB = jest.fn(function (this: any, _ctxt: CompileContext) {});

      expect(compileAdviceA).not.toHaveBeenCalled();
      expect(compileAdviceB).not.toHaveBeenCalled();

      class A {
        constructor() {}

        method(
          @AParameter()
          @BParameter()
          _param = 'A',
        ) {}
      }

      expect(compileAdviceA).toHaveBeenCalledTimes(1);
      expect(compileAdviceB).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @Compile(on.parameters.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AParameter], [BParameter]);
    });

    it('calls through the advice once', () => {
      compileAdviceA = jest.fn(function (this: any, _ctxt: CompileContext) {});
      compileAdviceB = jest.fn(function (this: any, _ctxt: CompileContext) {});

      expect(compileAdviceA).not.toHaveBeenCalled();
      expect(compileAdviceB).not.toHaveBeenCalled();

      class A {
        constructor() {}

        method(
          @AParameter()
          @BParameter()
          _param = 'A',
        ) {
          methodImpl();
        }
      }

      expect(compileAdviceA).toHaveBeenCalledTimes(1);
      expect(compileAdviceB).toHaveBeenCalledTimes(1);
      expect(methodImpl).not.toHaveBeenCalled();
    });

    describe('when the advice returns a value', () => {
      describe('and the value is not a function nor a property descriptor', () => {
        it('throws an AdviceError', () => {
          compileAdviceA = jest.fn(() => {
            return 'foo';
          });
          expect(() => {
            class A {
              method(
                @AParameter()
                @BParameter()
                _param = 'A',
              ) {}
            }
          }).toThrow(AdviceError);
        });
      });
      describe('and the returned value is a function', () => {
        it('replaces the original method', () => {
          compileAdviceA = jest.fn(() => {
            return function (this: any, ...args: string[]) {
              return `${this.label}-compileAdviceA-${args.join('-')}`;
            };
          });
          class A {
            constructor(private label: string) {}

            method(
              @AParameter()
              @BParameter()
              param = 'A',
              ...args: any[]
            ) {
              methodImpl();
            }
          }

          expect(new A('A').method('arg1', 'arg2')).toEqual(
            'A-compileAdviceA-arg1-arg2',
          );
        });
      });
      describe('and the value is a property descriptor', () => {
        it('replaces the method with that descriptor', () => {
          const newFunctionDescriptor: PropertyDescriptor = {
            value: jest.fn(function (this: any, ...args: string[]) {
              return `compileAdviceA-${args.join('-')}`;
            }),
          };
          compileAdviceA = jest.fn(function (this: any) {
            return newFunctionDescriptor;
          });

          class A {
            method(
              @AParameter()
              @BParameter()
              param = 'A',
              ...args: any[]
            ) {
              methodImpl();
              methodImpl();
            }
          }
          expect(compileAdviceA).toHaveBeenCalled();
          expect(new A().method('arg1', 'arg2')).toEqual(
            'compileAdviceA-arg1-arg2',
          );
          expect(newFunctionDescriptor.value).toHaveBeenCalled();
        });
      });
    });

    describe('is called with a context that ', () => {
      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          prop = 'A';
          constructor() {}

          method(
            @AParameter()
            @BParameter()
            _param = 'A',
          ) {}
        }
        compileAdviceA = jest.fn(
          (ctxt: CompileContext<PointcutType.CLASS, A>) => {
            expect(ctxt.annotations().find().length).toEqual(2);
            const aclassAnnotationContext = ctxt
              .annotations(AParameter)
              .find()[0];
            const bclassAnnotationContext = ctxt
              .annotations(BParameter)
              .find()[0];

            expect(aclassAnnotationContext).toBeTruthy();
            expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
            expect(aclassAnnotationContext?.target.declaringClass).toBe(A);
            expect(bclassAnnotationContext).toBeTruthy();
            expect(bclassAnnotationContext?.args).toEqual([]);
            expect(bclassAnnotationContext?.target.declaringClass).toBe(A);
          },
        );
      });
    });
  });
});
