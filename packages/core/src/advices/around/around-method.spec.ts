import 'jest-extended';
import 'jest-extended/all';
import { Before } from '../before/before.annotation';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';

import type { PointcutType } from '../../pointcut/pointcut-target.type';
import { JoinPoint } from '../../public_api';
import { WeaverModule } from '../../weaver/weaver.module';
import { Around } from './around.annotation';
import { AroundContext } from './around.context';

describe('method advice', () => {
  let aroundAdviceA: ReturnType<typeof jest.fn>;
  let aroundAdviceB: ReturnType<typeof jest.fn>;
  let beforeAdvice: ReturnType<typeof jest.fn>;
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
    const context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);

    aroundAdviceA = jest.fn((c: AroundContext) => c.joinpoint(...c.args));
    aroundAdviceB = jest.fn((c: AroundContext) => c.joinpoint(...c.args));
    beforeAdvice = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect()
    class AAspect {
      @Around(on.methods.withAnnotations(...aanotations))
      applyAround(
        ctxt: AroundContext<PointcutType.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA.bind(this)(ctxt, ...args);
      }

      @Around(on.methods.withAnnotations(...aanotations))
      applyAround2(
        ctxt: AroundContext<PointcutType.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceB.bind(this)(ctxt, ...args);
      }

      @Before(on.methods.withAnnotations(...aanotations))
      applyBefore(
        ctxt: AroundContext<PointcutType.CLASS>,
        ...args: unknown[]
      ): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect()
    class BAspect {
      @Around(on.methods.withAnnotations(...bannotations))
      applyAround(
        ctxt: AroundContext<PointcutType.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
    methodImpl = jest.fn();
  }

  describe('on pointcut @Around(on.methods.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        @AMethod()
        method(): any {}
      }

      expect(aroundAdviceA).not.toHaveBeenCalled();
      aroundAdviceA = jest.fn(function (this: any, _ctxt: AroundContext<any>) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      new A().method();
      expect(aroundAdviceA).toBeCalled();
    });

    it('calls through each matching advice once', () => {
      class A {
        @AMethod()
        method(...args: any): any {
          return methodImpl(...args);
        }
      }

      expect(aroundAdviceA).not.toHaveBeenCalled();
      aroundAdviceA = jest.fn(function (
        this: any,
        _ctxt: AroundContext,
        jp: JoinPoint,
        jpArgs: any[],
      ) {
        return jp(...jpArgs);
      });

      new A().method();
      expect(aroundAdviceA).toHaveBeenCalledTimes(2);
      expect(methodImpl).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @Around(on.methods.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AMethod], [BMethod]);
    });

    it('calls through the advice once', () => {
      class A {
        @AMethod()
        method(...args: any): any {
          return methodImpl(...args);
        }
      }

      expect(aroundAdviceA).not.toHaveBeenCalled();
      aroundAdviceA = jest.fn(function (this: any, _ctxt: AroundContext) {});

      new A().method();
      expect(aroundAdviceA).toHaveBeenCalledTimes(1);
    });

    describe('when the joinpoint is not called', () => {
      beforeEach(() => {
        aroundAdviceA = jest.fn(function (this: any) {});
      });
      it('does not call through the ORIGINAL METHOD', () => {
        class A {
          @AMethod()
          method(...args: any): any {
            return methodImpl(...args);
          }
        }

        new A().method();
        expect(methodImpl).not.toHaveBeenCalled();
        expect(aroundAdviceA).toHaveBeenCalled();
      });

      it('returns undefined', () => {
        class A {
          @AMethod()
          method(): any {
            return 'VALUE';
          }
        }

        expect(new A().method()).toBe(undefined);
        expect(aroundAdviceA).toHaveBeenCalled();
      });
    });

    describe('when the joinpoint is called', () => {
      beforeEach(() => {
        aroundAdviceA = jest.fn((ctxt: AroundContext<PointcutType.CLASS>) => {
          return ctxt.joinpoint(...ctxt.args);
        });
      });
      it('calls the aspect around the method', () => {
        class A {
          @AMethod()
          method(...args: any): any {
            return methodImpl(...args);
          }
        }

        new A().method();
        expect(beforeAdvice).toHaveBeenCalled();
        expect(aroundAdviceA).toHaveBeenCalled();
        expect(methodImpl).toHaveBeenCalled();
        expect(beforeAdvice).toHaveBeenCalledBefore(methodImpl);
        expect(aroundAdviceA).toHaveBeenCalledBefore(beforeAdvice);
      });
    });

    describe('when the advice returns a value', () => {
      it('replaces the value returned by the original method', () => {
        const newVal = 'newVal';
        class A {
          @AMethod()
          method(...args: any): any {
            return methodImpl(...args);
          }
        }
        aroundAdviceA = jest.fn(function (this: any) {
          return newVal;
        });

        const a = new A().method();
        expect(aroundAdviceA).toHaveBeenCalled();
        expect(a).toBe(newVal);
      });
    });

    describe('when multiple "around" advices are configured', () => {
      describe('and the joinpoint has been called', () => {
        let labels: string[];
        beforeEach(() => {
          labels = [];

          aroundAdviceA = jest.fn((ctxt: AroundContext) => {
            labels.push('beforeA');
            ctxt.joinpoint();
            labels.push('afterA');
          });
          aroundAdviceB = jest.fn((ctxt: AroundContext) => {
            labels.push('beforeB');
            ctxt.joinpoint();
            labels.push('afterB');
          });
        });
        it('should call them nested, in declaration order', () => {
          class A {
            @AMethod()
            method(...args: any): any {
              return methodImpl(...args);
            }
          }

          new A().method();
          expect(labels).toEqual(['beforeA', 'beforeB', 'afterB', 'afterA']);
        });
      });
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = the class instance', () => {
        class A {
          @AMethod()
          method(...args: any): any {
            return methodImpl(...args);
          }
        }
        aroundAdviceA = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        a.method();

        expect(thisInstance).toBe(a);
        expect(aroundAdviceA).toHaveBeenCalled();
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          @AMethod('annotationArg')
          @BMethod()
          method(...args: any): any {
            return methodImpl(...args);
          }
        }
        aroundAdviceA = jest.fn((ctxt: AroundContext) => {
          expect(ctxt.annotations.find().length).toEqual(2);
          const aPropertyAnnotationContext = ctxt.annotations
            .filter(AMethod)
            .find()[0];
          expect(aPropertyAnnotationContext).toBeTruthy();
          expect(aPropertyAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A().method();
      });
    });
  });
});
