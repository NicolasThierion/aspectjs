import 'jest-extended';
import 'jest-extended/all';
import { Before } from '../before/before.annotation';
import { AfterThrowContext } from './after-throw.context';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { weaverContext } from '../../weaver/context/weaver.context.global';

import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import { AfterThrow } from '../../public_api';

describe('property advice', () => {
  let afterThrowAdviceA1: ReturnType<typeof jest.fn>;
  let afterThrowAdviceA2: ReturnType<typeof jest.fn>;
  let afterThrowAdviceB: ReturnType<typeof jest.fn>;
  let beforeAdvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
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
    const context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);

    afterThrowAdviceA1 = jest.fn((ctxt: AfterThrowContext) => {
      throw ctxt.error;
    });
    afterThrowAdviceA2 = jest.fn((ctxt: AfterThrowContext) => {
      throw ctxt.error;
    });
    afterThrowAdviceB = jest.fn((ctxt: AfterThrowContext) => {
      throw ctxt.error;
    });
    beforeAdvice = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('APropertyLabel')
    class AAspect {
      @AfterThrow(on.properties.withAnnotations(...aanotations))
      applyAfterThrow(ctxt: AfterThrowContext, ...args: unknown[]): void {
        return afterThrowAdviceA1.bind(this)(ctxt, ...args);
      }

      @AfterThrow(on.properties.withAnnotations(...aanotations))
      applyAfterThrow2(ctxt: AfterThrowContext, ...args: unknown[]): void {
        return afterThrowAdviceA2.bind(this)(ctxt, ...args);
      }

      @Before(on.properties.withAnnotations(...aanotations))
      applyBefore(ctxt: AfterThrowContext, ...args: unknown[]): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BPropertyLabel')
    class BAspect {
      @AfterThrow(on.properties.withAnnotations(...bannotations))
      applyAfterThrow(
        ctxt: AfterThrowContext<PointcutTargetType.CLASS>,
        ...args: unknown[]
      ): void {
        return afterThrowAdviceB.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
  }

  describe('on pointcut @AfterThrow(on.properties.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        @AProperty()
        get labels() {
          throw new Error('original error');
        }
      }

      expect(afterThrowAdviceA1).not.toHaveBeenCalled();
      afterThrowAdviceA1 = jest.fn(function (this: any) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      new A().labels;
      expect(afterThrowAdviceA1).toBeCalled();
    });

    it('calls through each matching advice once', () => {
      class A {
        @AProperty()
        get labels() {
          throw new Error('original error');
        }
      }

      try {
        new A().labels;
      } catch (e: any) {
        expect(e.message).toBe('original error');
      }
      expect(afterThrowAdviceA1).toHaveBeenCalledTimes(1);
      expect(afterThrowAdviceA2).toHaveBeenCalledTimes(1);
      expect(afterThrowAdviceB).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @AfterThrow(on.properties.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AProperty], [BProperty]);
    });

    it('calls through each matching advice once', () => {
      class A {
        @AProperty()
        get labels() {
          throw new Error('original error');
        }
      }

      expect(afterThrowAdviceA1).not.toHaveBeenCalled();

      try {
        new A().labels;
      } catch (e: any) {
        expect(e.message).toContain('original error');
      }
      expect(afterThrowAdviceA1).toHaveBeenCalledTimes(1);
      expect(afterThrowAdviceA2).toHaveBeenCalledTimes(1);
    });
    it('receives no arguments', () => {
      class A {
        @AProperty()
        get labels() {
          throw new Error('original error');
        }
      }

      expect(afterThrowAdviceA1).not.toHaveBeenCalled();
      afterThrowAdviceA1 = jest.fn(function (
        this: any,
        ctxt: AfterThrowContext,
      ) {
        expect(ctxt.args).toEqual([]);
      });

      new A().labels;
      expect(afterThrowAdviceA1).toHaveBeenCalled();
    });

    describe('when the advice does not throw', () => {
      it('does not call other @AfterThrow advices', () => {
        class A {
          @AProperty()
          get labels() {
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn();
        afterThrowAdviceA2 = jest.fn();
        new A().labels;
        expect(afterThrowAdviceA1).toHaveBeenCalled();
        expect(afterThrowAdviceA2).not.toHaveBeenCalled();
      });
    });

    describe('when the advice throws an error', () => {
      it('call others @AfterThrow advices', () => {
        class A {
          @AProperty()
          get labels() {
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn(() => {
          throw new Error('advised error');
        });
        afterThrowAdviceA2 = jest.fn((ctxt: AfterThrowContext) => {
          expect((ctxt.error as any).message).toEqual('advised error');
        });
        new A().labels;
        expect(afterThrowAdviceA1).toHaveBeenCalled();
        expect(afterThrowAdviceA2).toHaveBeenCalled();
      });
    });

    it('replaces the returned value of the original property', () => {
      class A {
        @AProperty()
        get labels() {
          throw new Error('original error');
        }
      }
      afterThrowAdviceA1 = jest.fn(function () {
        return 'newVal';
      });

      const a = new A().labels;
      expect(a).toEqual('newVal');
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = the class instance', () => {
        class A {
          @AProperty()
          get labels() {
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        a.labels;

        expect(thisInstance).toBe(a);
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          @AProperty('annotationArg')
          @BProperty()
          @BProperty()
          get labels() {
            throw new Error('original error');
          }
        }

        afterThrowAdviceA1 = jest.fn((ctxt: AfterThrowContext) => {
          expect(ctxt.annotations.length).toEqual(3);
          const APropertyAnnotationContext = ctxt.annotations.filter(
            (an) => an.ref === AProperty.ref,
          )[0];
          expect(APropertyAnnotationContext).toBeTruthy();
          expect(APropertyAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A().labels;
        expect(afterThrowAdviceA1).toHaveBeenCalled();
      });

      it('has context.error = the error that has been throws', () => {
        const e = new Error('original error');
        class A {
          @AProperty()
          get labels() {
            throw e;
          }
        }
        afterThrowAdviceA1 = jest.fn((ctxt: AfterThrowContext, err) => {
          expect(ctxt.error).toBe(e);
          expect(err).toBe(e);
        });
        new A().labels;

        expect(afterThrowAdviceA1).toHaveBeenCalled();
      });
    });
  });
});
