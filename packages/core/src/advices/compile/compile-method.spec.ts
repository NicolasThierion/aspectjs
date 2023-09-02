import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { AdviceError, JoinpointType } from '../../public_api';
import { weaverContext } from '../../weaver/context/weaver.context.global';
import { Compile } from './compile.annotation';
import { CompileContext } from './compile.context';

/* eslint-disable @typescript-eslint/no-unused-vars */
describe('method advice', () => {
  let compileAdviceA: ReturnType<typeof jest.fn>;
  let compileAdviceB: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  let methodImpl: any;
  const AMethod = new AnnotationFactory('test').create(
    AnnotationType.METHOD,
    'AMethod',
  );
  const BMethod = new AnnotationFactory('test').create(
    AnnotationType.METHOD,
    'BMethod',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);

    compileAdviceA = jest.fn((c: CompileContext) => {});
    compileAdviceB = jest.fn((c: CompileContext) => {});
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('AClassLabel')
    class AAspect {
      @Compile(on.methods.withAnnotations(...aanotations))
      applyCompile(
        ctxt: CompileContext<JoinpointType.METHOD>,
        ...args: unknown[]
      ): void {
        return compileAdviceA.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BClassLabel')
    class BAspect {
      @Compile(on.methods.withAnnotations(...bannotations))
      applyCompile(
        ctxt: CompileContext<JoinpointType.METHOD>,
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

  describe('on pointcut @Compile(on.methods.withAnnotations()', () => {
    beforeEach(() => setupAspects());

    it('calls through each matching advice once', () => {
      compileAdviceA = jest.fn(function (this: any, _ctxt: CompileContext) {});
      compileAdviceB = jest.fn(function (this: any, _ctxt: CompileContext) {});

      expect(compileAdviceA).not.toHaveBeenCalled();
      expect(compileAdviceB).not.toHaveBeenCalled();

      class A {
        constructor() {}

        @AMethod()
        @BMethod()
        method() {
          methodImpl();
        }
      }

      expect(compileAdviceA).toHaveBeenCalledTimes(1);
      expect(compileAdviceB).toHaveBeenCalledTimes(1);
      expect(methodImpl).not.toHaveBeenCalled();
    });
  });

  describe('on pointcut @Compile(on.methods.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AMethod], [BMethod]);
    });

    it('calls through the advice once', () => {
      compileAdviceA = jest.fn(function (this: any, _ctxt: CompileContext) {});
      compileAdviceB = jest.fn(function (this: any, _ctxt: CompileContext) {});

      expect(compileAdviceA).not.toHaveBeenCalled();
      expect(compileAdviceB).not.toHaveBeenCalled();

      class A {
        constructor() {}

        @AMethod()
        @BMethod()
        method() {
          methodImpl();
        }
      }

      expect(compileAdviceA).toHaveBeenCalledTimes(1);
      expect(compileAdviceB).toHaveBeenCalledTimes(1);
      expect(methodImpl).not.toHaveBeenCalled();
    });

    describe('when the advice returns a value', () => {
      describe('and the value is not a function', () => {
        it('throws an AdviceError', () => {
          compileAdviceA = jest.fn(() => {
            return 'foo';
          });
          expect(() => {
            class A {
              @AMethod()
              method() {
                methodImpl();
              }
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
            @AMethod()
            method(...args: any) {
              return methodImpl(args);
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
            @AMethod()
            method(...args: any[]) {
              return methodImpl(...args);
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

    describe('when multiple "compile" advices are configured', () => {
      it('calls through them one after the other', () => {
        compileAdviceA = jest.fn(function (
          ctxt: CompileContext<JoinpointType.METHOD>,
        ) {
          const originalMethod = ctxt.target.proto[ctxt.target.propertyKey];
          return jest.fn(function (this: any, ...args: string[]) {
            return [originalMethod.call(this, ...args), 'A'].join('-');
          });
        });
        compileAdviceB = jest.fn(function (
          ctxt: CompileContext<JoinpointType.METHOD>,
        ) {
          const originalMethod = ctxt.target.proto[ctxt.target.propertyKey];
          return jest.fn(function (this: any, ...args: string[]) {
            return [originalMethod.call(this, ...args), 'B'].join('-');
          });
        });

        methodImpl = jest.fn(function (...args: any[]) {
          return [this.name, ...args].join('-');
        });
        class A {
          constructor(public name: string) {}

          @AMethod()
          @BMethod()
          method(...args: string[]) {
            return methodImpl.call(this, ...args);
          }
        }
        expect(compileAdviceA).toHaveBeenCalled();
        const a = new A('orig');

        expect(a.method('arg1', 'arg2')).toEqual('orig-arg1-arg2-B-A');
      });
    });

    describe('is called with a context that ', () => {
      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          prop = 'A';
          constructor() {}

          @AMethod('annotationArg')
          @BMethod()
          method() {
            methodImpl();
          }
        }
        compileAdviceA = jest.fn(
          (ctxt: CompileContext<JoinpointType.CLASS, A>) => {
            expect(ctxt.annotations.find().length).toEqual(2);
            const aclassAnnotationContext = ctxt.annotations
              .filter(AMethod)
              .find()[0];
            const bclassAnnotationContext = ctxt.annotations
              .filter(BMethod)
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
