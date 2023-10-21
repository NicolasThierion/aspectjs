import 'jest-extended';
import 'jest-extended/all';
import { Before } from '../before/before.annotation';
import { AfterReturnContext } from './after-return.context';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';

import type { PointcutType } from '../../pointcut/pointcut-target.type';
import { AfterReturn } from '../../public_api';
import { WeaverModule } from '../../weaver/weaver.module';

describe('method advice', () => {
  let afterReturnA1: ReturnType<typeof jest.fn>;
  let afterReturnA2: ReturnType<typeof jest.fn>;
  let afterReturnB: ReturnType<typeof jest.fn>;
  let beforeAdvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
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

    afterReturnA1 = jest.fn();
    afterReturnA2 = jest.fn();
    afterReturnB = jest.fn();
    beforeAdvice = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('AMethodLabel')
    class AAspect {
      @AfterReturn(on.methods.withAnnotations(...aanotations))
      applyAfterReturn(ctxt: AfterReturnContext, ...args: unknown[]): void {
        return afterReturnA1.bind(this)(ctxt, ...args);
      }

      @AfterReturn(on.methods.withAnnotations(...aanotations))
      applyAfterReturn2(ctxt: AfterReturnContext, ...args: unknown[]): void {
        return afterReturnA2.bind(this)(ctxt, ...args);
      }

      @Before(on.methods.withAnnotations(...aanotations))
      applyBefore(ctxt: AfterReturnContext, ...args: unknown[]): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BMethodLabel')
    class BAspect {
      @AfterReturn(on.methods.withAnnotations(...bannotations))
      applyAfterReturn(ctxt: AfterReturnContext, ...args: unknown[]): void {
        return afterReturnB.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
  }

  describe('on pointcut @AfterReturn(on.methods.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        public labels?: string[];
        @AMethod()
        m(labels = ['A']) {
          this.labels = labels;
        }
      }

      expect(afterReturnA1).not.toHaveBeenCalled();
      afterReturnA1 = jest.fn(function (this: any) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      new A().m();
      expect(afterReturnA1).toBeCalled();
    });

    it('calls through each matching advice once', () => {
      class A {
        public labels?: string[];
        @AMethod()
        m(labels = ['A']) {
          this.labels = labels;
        }
      }
      new A().m();
      expect(afterReturnA1).toHaveBeenCalledTimes(1);
      expect(afterReturnA2).toHaveBeenCalledTimes(1);
      expect(afterReturnB).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @AfterReturn(on.methods.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AMethod], [BMethod]);
    });

    it('calls through each matching advice once', () => {
      class A {
        public labels?: string[];
        @AMethod()
        m(labels = ['A']) {
          this.labels = labels;
        }
      }

      expect(afterReturnA1).not.toHaveBeenCalled();

      new A().m();
      expect(afterReturnA1).toHaveBeenCalledTimes(1);
      expect(afterReturnA2).toHaveBeenCalledTimes(1);
    });
    it('receives method arguments', () => {
      class A {
        public labels?: string[];
        @AMethod()
        m(labels = ['A']) {
          this.labels = labels;
        }
      }

      expect(afterReturnA1).not.toHaveBeenCalled();
      afterReturnA1 = jest.fn(function (this: any, ctxt: AfterReturnContext) {
        expect(ctxt.args).toEqual([['X']]);
      });

      new A().m(['X']);
      expect(afterReturnA1).toHaveBeenCalled();
    });

    describe('when the advice returns a new value', () => {
      it('pass that new value to subsequent advices', () => {
        const newValue = ['advised'];
        class A {
          public labels?: string[];
          @AMethod()
          m(labels = ['A']) {
            this.labels = labels;
          }
        }
        afterReturnA1 = jest.fn(() => {
          return newValue;
        });
        afterReturnA2 = jest.fn((ctxt: AfterReturnContext, value) => {
          expect(value).toBe(newValue);
          expect(ctxt.value).toBe(newValue);

          return newValue;
        });
        const r = new A().m();
        expect(r).toBe(newValue);
        expect(afterReturnA1).toHaveBeenCalled();
        expect(afterReturnA2).toHaveBeenCalled();
      });
    });

    describe('when the advice throws an error', () => {
      it('does not call others @AfterReturn advices', () => {
        const error = new Error('error');
        class A {
          public labels?: string[];
          @AMethod()
          m(labels = ['A']) {
            this.labels = labels;
          }
        }
        afterReturnA1 = jest.fn(() => {
          throw error;
        });
        try {
          new A().m();
        } catch (err) {
          // noop
          expect(err).toBe(error);
        }
        expect(afterReturnA1).toHaveBeenCalled();
        expect(afterReturnA2).not.toHaveBeenCalled();
      });
    });

    describe('when the advice returns', () => {
      describe('undefined', () => {
        it('replaces the original returned value with undefined', () => {
          class A {
            public labels?: string[];
            @AMethod()
            m(labels = ['A']) {
              this.labels = labels;
              return labels;
            }
          }
          afterReturnA1 = jest.fn(function (
            ctxt: AfterReturnContext<PointcutType.CLASS, A>,
          ) {
            ctxt.instance.labels = ctxt.instance.labels?.concat(['B']);
          });

          const a = new A();
          expect(a.m()).toBe(undefined);
          expect(a.labels).toEqual(['A', 'B']);
        });
      });
      describe('an value', () => {
        it('replaces the original returned value', () => {
          class A {
            @AMethod()
            m() {}
          }
          afterReturnA1 = jest.fn(function () {
            return ['A'];
          });

          afterReturnA2 = jest.fn(function (ctxt: AfterReturnContext, value) {
            expect(ctxt.value).toEqual(['A']);
            expect(value).toEqual(['A']);
            return ['B'];
          });

          const a = new A();
          expect(a.m()).toEqual(['B']);
        });
      });
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = the class instance', () => {
        class A {
          public labels?: string[];
          @AMethod()
          m(labels = ['A']) {
            this.labels = labels;
          }
        }
        afterReturnA1 = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        a.m();
        expect(thisInstance).toBe(a);
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          public labels?: string[];
          @AMethod('annotationArg')
          @BMethod()
          m(labels = ['A']) {
            this.labels = labels;
          }
        }
        afterReturnA1 = jest.fn((ctxt: AfterReturnContext) => {
          expect(ctxt.annotations.find().length).toEqual(2);
          const AMethodAnnotationContext = ctxt.annotations
            .filter(AMethod)
            .find()[0]!;
          expect(AMethodAnnotationContext).toBeTruthy();
          expect(AMethodAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A().m();
        expect(afterReturnA1).toHaveBeenCalled();
      });

      it('has context.value = the class instance', () => {
        let instance: any;
        class A {
          public labels?: string[];
          @AMethod('annotationArg')
          @BMethod()
          m(labels = ['A']) {
            this.labels = labels;
          }
        }
        afterReturnA1 = jest.fn((ctxt: AfterReturnContext) => {
          instance = ctxt.instance;
        });
        const a = new A();
        a.m();
        expect(a).toBe(instance);

        expect(afterReturnA1).toHaveBeenCalled();
      });
    });
  });
});
