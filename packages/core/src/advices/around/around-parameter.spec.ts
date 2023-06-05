import 'jest-extended';
import 'jest-extended/all';
import { WeavingError } from '../../errors/weaving.error';
import { Before } from '../before/before.annotation';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { weaverContext } from '../../weaver/context/weaver.context.global';

import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import { JoinPoint } from '../../public_api';
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
    AnnotationType.PARAMETER,
    'AParameter',
  );
  const BParameter = new AnnotationFactory('test').create(
    AnnotationType.PARAMETER,
    'BParameter',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(weaverContext());
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
        ctxt: AroundContext<PointcutTargetType.PARAMETER>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA1.bind(this)(ctxt, ...args);
      }

      @Around(on.parameters.withAnnotations(...aanotations))
      applyAround2(
        ctxt: AroundContext<PointcutTargetType.PARAMETER>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA2.bind(this)(ctxt, ...args);
      }

      @Before(on.parameters.withAnnotations(...aanotations))
      applyBefore(
        ctxt: AroundContext<PointcutTargetType.PARAMETER>,
        ...args: unknown[]
      ): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect()
    class BAspect {
      @Around(on.parameters.withAnnotations(...bannotations))
      applyAround(
        ctxt: AroundContext<PointcutTargetType.PARAMETER>,
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
      describe('once', () => {
        beforeEach(() => {
          aroundAdviceA1 = jest.fn(
            (ctxt: AroundContext<PointcutTargetType.PARAMETER>) => {
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
      describe('twice', () => {
        beforeEach(() => {
          aroundAdviceA1 = jest.fn((ctxt: AroundContext, jp: JoinPoint) => {
            jp();
            jp();
          });
        });
        it('throws an error', () => {
          class A {
            method(
              @AParameter()
              arg1?: any,
            ): any {
              return methodImpl(arg1);
            }
          }

          expect(() => new A().method()).toThrow(
            new WeavingError(
              'Error applying advice @Around(@test:AParameter) AAspect.applyAround() on parameter A.method(#0): joinPoint already proceeded',
            ),
          );
        });
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
          expect(labels).toEqual(['beforeB', 'beforeA', 'afterA', 'afterB']);
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
          expect(ctxt.annotations.find().length).toEqual(2);
          const aPropertyAnnotationContext = ctxt.annotations
            .filter(AParameter)
            .find()[0];
          expect(aPropertyAnnotationContext).toBeTruthy();
          expect(aPropertyAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A().method();
      });
    });
  });
});
