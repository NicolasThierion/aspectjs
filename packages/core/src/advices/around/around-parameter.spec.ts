import 'jest-extended';
import 'jest-extended/all';
import { Before } from '../before/before.annotation';

import { AnnotationFactory, AnnotationKind } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';

import type { PointcutKind } from '../../pointcut/pointcut-kind.type';
import { JoinPoint } from '../../public_api';
import { WeaverModule } from '../../weaver/weaver.module';
import { Around } from './around.annotation';
import { AroundContext } from './around.context';

describe('parameter advice', () => {
  let aroundAdviceA1: ReturnType<typeof jest.fn>;
  let aroundAdviceA2: ReturnType<typeof jest.fn>;
  let aroundAdviceB: ReturnType<typeof jest.fn>;
  let beforeAdvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  let methodImpl: any;
  const AParameter = new AnnotationFactory('test').create(
    AnnotationKind.PARAMETER,
    'AParameter',
  );
  const BParameter = new AnnotationFactory('test').create(
    AnnotationKind.PARAMETER,
    'BParameter',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);

    aroundAdviceA1 = jest.fn((c: AroundContext) => c.joinpoint(...c.args));
    aroundAdviceA2 = jest.fn((c: AroundContext) => c.joinpoint(...c.args));
    aroundAdviceB = jest.fn((c: AroundContext) => c.joinpoint(...c.args));
    beforeAdvice = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect()
    class AAspect {
      @Around(on.parameters.withAnnotations(...aanotations))
      applyAround(
        ctxt: AroundContext<PointcutKind.PARAMETER>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA1.bind(this)(ctxt, ...args);
      }

      @Around(on.parameters.withAnnotations(...aanotations))
      applyAround2(
        ctxt: AroundContext<PointcutKind.PARAMETER>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA2.bind(this)(ctxt, ...args);
      }

      @Before(on.parameters.withAnnotations(...aanotations))
      applyBefore(
        ctxt: AroundContext<PointcutKind.PARAMETER>,
        ...args: unknown[]
      ): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect()
    class BAspect {
      @Around(on.parameters.withAnnotations(...bannotations))
      applyAround(
        ctxt: AroundContext<PointcutKind.PARAMETER>,
        ...args: unknown[]
      ): void {
        return aroundAdviceB.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
    methodImpl = jest.fn();
  }

  describe('on pointcut @Around(on.parameters.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        method(
          @AParameter()
          _arg1?: any,
        ): any {}
      }

      expect(aroundAdviceA1).not.toHaveBeenCalled();
      aroundAdviceA1 = jest.fn(function (this: any, ctxt: AroundContext<any>) {
        expect(this === aaspect || this === baspect).toBeTrue();
        return ctxt.joinpoint(...ctxt.args);
      });

      new A().method();
      expect(aroundAdviceA1).toBeCalled();
    });

    it('calls through each matching advice once', () => {
      class A {
        method(
          @AParameter()
          arg1?: any,
        ): any {
          return methodImpl(arg1);
        }
      }

      expect(aroundAdviceA1).not.toHaveBeenCalled();
      aroundAdviceA1 = jest.fn(function (
        this: any,
        _ctxt: AroundContext,
        jp: JoinPoint,
        jpArgs: any[],
      ) {
        return jp(...jpArgs);
      });

      new A().method();
      expect(aroundAdviceA1).toHaveBeenCalledTimes(1);
      expect(aroundAdviceA2).toHaveBeenCalledTimes(1);
      expect(aroundAdviceB).toHaveBeenCalledTimes(1);
      expect(methodImpl).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @Around(on.parameters.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AParameter], [BParameter]);
    });

    it('calls through the advice once', () => {
      class A {
        method(
          @AParameter()
          arg1?: any,
        ): any {
          return methodImpl(arg1);
        }
      }

      expect(aroundAdviceA1).not.toHaveBeenCalled();

      new A().method();
      expect(aroundAdviceA1).toHaveBeenCalledTimes(1);
      expect(aroundAdviceA2).toHaveBeenCalledTimes(1);
    });

    describe('when the joinpoint is not called', () => {
      beforeEach(() => {
        aroundAdviceA1 = jest.fn(function (this: any) {});
      });
      it('does not call through the original method', () => {
        class A {
          method(
            @AParameter()
            arg1?: any,
          ): any {
            return methodImpl(arg1);
          }
        }

        new A().method();
        expect(methodImpl).not.toHaveBeenCalled();
        expect(aroundAdviceA1).toHaveBeenCalled();
      });

      it('returns undefined', () => {
        class A {
          method(
            @AParameter()
            _arg1?: any,
          ): any {
            return 'result';
          }
        }

        expect(new A().method()).toBe(undefined);
        expect(aroundAdviceA1).toHaveBeenCalled();
      });
    });

    describe('when the joinpoint is called', () => {
      beforeEach(() => {
        aroundAdviceA1 = jest.fn(
          (ctxt: AroundContext<PointcutKind.PARAMETER>) => {
            return ctxt.joinpoint(...ctxt.args);
          },
        );
      });
      it('calls the aspect around the method', () => {
        class A {
          method(
            @AParameter()
            arg1?: any,
          ): any {
            return methodImpl(arg1);
          }
        }

        new A().method();
        expect(beforeAdvice).toHaveBeenCalled();
        expect(aroundAdviceA1).toHaveBeenCalled();
        expect(methodImpl).toHaveBeenCalled();
        expect(beforeAdvice).toHaveBeenCalledBefore(methodImpl);
        expect(aroundAdviceA1).toHaveBeenCalledBefore(beforeAdvice);
      });
    });

    describe('when the advice returns a value', () => {
      it('replaces the value returned by the original method', () => {
        const newVal = 'newVal';
        class A {
          method(
            @AParameter()
            arg1?: any,
          ): any {
            return methodImpl(arg1);
          }
        }
        aroundAdviceA1 = jest.fn(function (this: any) {
          return newVal;
        });

        const a = new A().method();
        expect(aroundAdviceA1).toHaveBeenCalled();
        expect(a).toBe(newVal);
      });
    });

    describe('when multiple "around" advices are configured', () => {
      describe('and the joinpoint has been called', () => {
        let labels: string[];
        beforeEach(() => {
          labels = [];

          aroundAdviceA1 = jest.fn((ctxt: AroundContext) => {
            labels.push('beforeA');
            ctxt.joinpoint();
            labels.push('afterA');
          });
          aroundAdviceA2 = jest.fn((ctxt: AroundContext) => {
            labels.push('beforeB');
            ctxt.joinpoint();
            labels.push('afterB');
          });
        });
        it('should call them nested, in declaration order', () => {
          class A {
            method(
              @AParameter()
              arg1?: any,
            ): any {
              return methodImpl(arg1);
            }
          }

          new A().method();
          expect(labels).toEqual(['beforeA', 'beforeB', 'afterB', 'afterA']);
        });
      });
    });

    describe('is called with a context that ', () => {
      it('has context.instance = the class instance', () => {
        class A {
          method(
            @AParameter()
            arg1?: any,
          ): any {
            return methodImpl(arg1);
          }
        }
        aroundAdviceA1 = jest.fn((ctxt: AroundContext) => {
          expect(ctxt.instance).toBe(a);
        });
        const a = new A();
        a.method();

        expect(aroundAdviceA1).toHaveBeenCalled();
      });

      it('has context.args = the arguments given to the method', () => {
        class A {
          method(
            @AParameter()
            arg1?: any,
          ): any {
            return methodImpl(arg1);
          }
        }
        aroundAdviceA1 = jest.fn((ctxt: AroundContext) => {
          expect(ctxt.args).toEqual(['arg1']);
        });
        const a = new A();
        a.method('arg1');

        expect(aroundAdviceA1).toHaveBeenCalled();
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          method(
            @AParameter('annotationArg')
            @BParameter()
            arg1?: any,
          ): any {
            return methodImpl(arg1);
          }
        }
        aroundAdviceA1 = jest.fn((ctxt: AroundContext) => {
          expect(ctxt.annotations().find().length).toEqual(2);
          const aPropertyAnnotationContext = ctxt
            .annotations(AParameter)
            .find()[0];
          expect(aPropertyAnnotationContext).toBeTruthy();
          expect(aPropertyAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A().method();
      });
    });
  });
});
