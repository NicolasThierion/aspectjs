import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { AdviceError, JoinpointType } from '../../public_api';
import { WeaverModule } from '../../weaver/weaver.module';
import { Compile } from './compile.annotation';
import { CompileContext } from './compile.context';

/* eslint-disable @typescript-eslint/no-unused-vars */
describe('property advice', () => {
  let compileAdviceA: ReturnType<typeof jest.fn>;
  let compileAdviceB: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  let methodImpl: any;
  const AProperty = new AnnotationFactory('test').create(
    AnnotationType.PROPERTY,
    'AProperty',
  );
  const BProperty = new AnnotationFactory('test').create(
    AnnotationType.PROPERTY,
    'BProperty',
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
      @Compile(on.properties.withAnnotations(...aanotations))
      applyCompile(
        ctxt: CompileContext<JoinpointType.GET_PROPERTY>,
        ...args: unknown[]
      ): void {
        return compileAdviceA.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BClassLabel')
    class BAspect {
      @Compile(on.properties.withAnnotations(...bannotations))
      applyCompile(
        ctxt: CompileContext<JoinpointType.GET_PROPERTY>,
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

  describe('on pointcut @Compile(on.properties.withAnnotations()', () => {
    beforeEach(() => setupAspects());

    it('calls through each matching advice once', () => {
      compileAdviceA = jest.fn(function (this: any, _ctxt: CompileContext) {});
      compileAdviceB = jest.fn(function (this: any, _ctxt: CompileContext) {});

      expect(compileAdviceA).not.toHaveBeenCalled();
      expect(compileAdviceB).not.toHaveBeenCalled();
      class A {
        constructor() {}

        @AProperty()
        @BProperty()
        prop = 'A';
      }

      expect(compileAdviceA).toHaveBeenCalledTimes(1);
      expect(compileAdviceB).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @Compile(on.methods.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AProperty], [BProperty]);
    });

    it('calls through the advice once', () => {
      compileAdviceA = jest.fn(function (this: any, _ctxt: CompileContext) {});
      compileAdviceB = jest.fn(function (this: any, _ctxt: CompileContext) {});

      expect(compileAdviceA).not.toHaveBeenCalled();
      expect(compileAdviceB).not.toHaveBeenCalled();

      class A {
        constructor() {}

        @AProperty()
        @BProperty()
        prop = 'A';
      }

      expect(compileAdviceA).toHaveBeenCalledTimes(1);
      expect(compileAdviceB).toHaveBeenCalledTimes(1);
      expect(methodImpl).not.toHaveBeenCalled();
    });

    describe('when the advice returns a value', () => {
      describe('and the value is not a property descriptor', () => {
        it('throws an AdviceError', () => {
          compileAdviceA = jest.fn(() => {
            return function () {};
          });
          expect(() => {
            class A {
              @AProperty()
              prop = 'A';
            }
          }).toThrow(AdviceError);
        });
      });
      describe('and the returned value is a property descriptor', () => {
        it('replaces the original descriptor', () => {
          compileAdviceA = jest.fn(() => {
            return {
              get() {
                return 'test';
              },
              set() {},
              configurable: false,
            } satisfies PropertyDescriptor;
          });
          class A {
            @AProperty()
            prop = 'A';
            get m(): any {
              return;
            }
          }

          const a = new A();
          expect(a.prop).toEqual('test');
          expect(
            Object.getOwnPropertyDescriptor(Object.getPrototypeOf(a), 'prop')!
              .configurable,
          ).toEqual(false);
        });
      });
    });

    describe('is called with a context that ', () => {
      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          @AProperty('annotationArg')
          @BProperty()
          prop = 'A';
          constructor() {}
        }
        compileAdviceA = jest.fn(
          (ctxt: CompileContext<JoinpointType.CLASS, A>) => {
            expect(ctxt.annotations.find().length).toEqual(2);
            const aclassAnnotationContext = ctxt.annotations
              .filter(AProperty)
              .find()[0];
            const bclassAnnotationContext = ctxt.annotations
              .filter(BProperty)
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
