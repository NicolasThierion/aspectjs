import 'jest-extended';
import 'jest-extended/all';
import { Before } from '../before/before.annotation';
import { AfterThrowContext } from './after-throw.context';

import { AnnotationFactory, AnnotationKind } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';

import type { PointcutKind } from '../../pointcut/pointcut-kind.type';
import { AdviceError, AfterThrow } from '../../public_api';
import { WeaverModule } from '../../weaver/weaver.module';

describe('property advice', () => {
  let afterThrowAdviceA1: ReturnType<typeof jest.fn>;
  let afterThrowAdviceA2: ReturnType<typeof jest.fn>;
  let afterThrowAdviceB: ReturnType<typeof jest.fn>;
  let beforeAdvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  const AProperty = new AnnotationFactory('test').create(
    AnnotationKind.PROPERTY,
    'AProperty',
  );
  const BProperty = new AnnotationFactory('test').create(
    AnnotationKind.PROPERTY,
    'BProperty',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(WeaverModule);
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
      @AfterThrow(on.properties.setter.withAnnotations(...aanotations))
      applyAfterThrow(ctxt: AfterThrowContext, ...args: unknown[]): void {
        return afterThrowAdviceA1.bind(this)(ctxt, ...args);
      }

      @AfterThrow(on.properties.setter.withAnnotations(...aanotations))
      applyAfterThrow2(ctxt: AfterThrowContext, ...args: unknown[]): void {
        return afterThrowAdviceA2.bind(this)(ctxt, ...args);
      }

      @Before(on.properties.setter.withAnnotations(...aanotations))
      applyBefore(ctxt: AfterThrowContext, ...args: unknown[]): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BPropertyLabel')
    class BAspect {
      @AfterThrow(on.properties.setter.withAnnotations(...bannotations))
      applyAfterThrow(
        ctxt: AfterThrowContext<PointcutKind.CLASS>,
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

  describe('on pointcut @AfterThrow(on.properties.setter.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        @AProperty()
        set labels(val: any) {
          expect(val).toEqual(['a']);
          throw new Error('original error');
        }
      }

      expect(afterThrowAdviceA1).not.toHaveBeenCalled();
      afterThrowAdviceA1 = jest.fn(function (this: any) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      new A().labels = ['a'];
      expect(afterThrowAdviceA1).toBeCalled();
    });

    it('calls through each matching advice once', () => {
      class A {
        @AProperty()
        set labels(val: any) {
          expect(val).toEqual(['a']);
          throw new Error('original error');
        }
      }

      try {
        new A().labels = ['a'];
      } catch (e: any) {
        expect(e.message).toBe('original error');
      }
      expect(afterThrowAdviceA1).toHaveBeenCalledTimes(1);
      expect(afterThrowAdviceA2).toHaveBeenCalledTimes(1);
      expect(afterThrowAdviceB).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @AfterThrow(on.properties.setter.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AProperty], [BProperty]);
    });

    it('calls through each matching advice once', () => {
      class A {
        @AProperty()
        set labels(val: any) {
          expect(val).toEqual(['a']);
          throw new Error('original error');
        }
      }

      expect(afterThrowAdviceA1).not.toHaveBeenCalled();

      try {
        new A().labels = ['a'];
      } catch (e: any) {
        expect(e.message).toContain('original error');
      }
      expect(afterThrowAdviceA1).toHaveBeenCalledTimes(1);
      expect(afterThrowAdviceA2).toHaveBeenCalledTimes(1);
    });
    it('receives the assigned value as arguments', () => {
      class A {
        @AProperty()
        set labels(val: any) {
          expect(val).toEqual(['a']);
          throw new Error('original error');
        }
      }

      expect(afterThrowAdviceA1).not.toHaveBeenCalled();
      afterThrowAdviceA1 = jest.fn(function (
        this: any,
        ctxt: AfterThrowContext,
      ) {
        expect(ctxt.args).toEqual([['a']]);
      });

      new A().labels = ['a'];
      expect(afterThrowAdviceA1).toHaveBeenCalled();
    });

    describe('when the advice does not throw', () => {
      it('does not call other @AfterThrow advices', () => {
        class A {
          @AProperty()
          set labels(val: any) {
            expect(val).toEqual(['a']);
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn();
        afterThrowAdviceA2 = jest.fn();
        new A().labels = ['a'];
        expect(afterThrowAdviceA1).toHaveBeenCalled();
        expect(afterThrowAdviceA2).not.toHaveBeenCalled();
      });
    });

    describe('when the advice throws an error', () => {
      it('call others @AfterThrow advices', () => {
        class A {
          @AProperty()
          set labels(val: any) {
            expect(val).toEqual(['a']);
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn(() => {
          throw new Error('advised error');
        });
        afterThrowAdviceA2 = jest.fn((ctxt: AfterThrowContext) => {
          expect((ctxt.error as any).message).toEqual('advised error');
        });
        new A().labels = ['a'];
        expect(afterThrowAdviceA1).toHaveBeenCalled();
        expect(afterThrowAdviceA2).toHaveBeenCalled();
      });
    });

    describe('when the advice returns a value', () => {
      it('throws an error', () => {
        class A {
          @AProperty()
          set labels(val: any) {
            expect(val).toEqual(['a']);
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn(function () {
          return 'newVal';
        });

        expect(() => {
          new A().labels = ['a'];
        }).toThrow();
        try {
          new A().labels = ['a'];
        } catch (e: any) {
          expect(e).toBeInstanceOf(AdviceError);
          expect(e.message).toContain(
            'Error applying advice @AfterThrow(@test:AProperty) AAspect.applyAfterThrow() on property A.labels: Returning from advice is not supported',
          );
        }
      });
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = the class instance', () => {
        class A {
          @AProperty()
          set labels(val: any) {
            expect(val).toEqual(['a']);
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        a.labels = ['a'];

        expect(thisInstance).toBe(a);
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          @AProperty('annotationArg')
          @BProperty()
          @BProperty()
          set labels(val: any) {
            expect(val).toEqual(['a']);
            throw new Error('original error');
          }
        }

        afterThrowAdviceA1 = jest.fn((ctxt: AfterThrowContext) => {
          expect(ctxt.annotations().find().length).toEqual(3);
          const APropertyAnnotationContext = ctxt
            .annotations(AProperty)
            .find()[0];
          expect(APropertyAnnotationContext).toBeTruthy();
          expect(APropertyAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A().labels = ['a'];
        expect(afterThrowAdviceA1).toHaveBeenCalled();
      });

      it('has context.error = the error that has been throws', () => {
        const e = new Error('original error');
        class A {
          @AProperty()
          set labels(val: any) {
            expect(val).toEqual(['a']);
            throw e;
          }
        }
        afterThrowAdviceA1 = jest.fn((ctxt: AfterThrowContext, err) => {
          expect(ctxt.error).toBe(e);
          expect(err).toBe(e);
        });
        new A().labels = ['a'];

        expect(afterThrowAdviceA1).toHaveBeenCalled();
      });
    });
  });
});
