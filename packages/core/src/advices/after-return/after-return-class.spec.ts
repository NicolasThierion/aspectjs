import 'jest-extended';
import 'jest-extended/all';
import { Before } from '../before/before.annotation';
import { AfterReturnContext } from './after-return.context';

import { AnnotationFactory, AnnotationKind } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';

import type { PointcutKind } from '../../pointcut/pointcut-kind.type';
import { WeaverModule } from '../../weaver/weaver.module';
import { AfterReturn } from './after-return.annotation';

describe('class advice', () => {
  let afterReturnA1: ReturnType<typeof jest.fn>;
  let afterReturnA2: ReturnType<typeof jest.fn>;
  let afterReturnB: ReturnType<typeof jest.fn>;
  let beforeAdvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  const AClass = new AnnotationFactory('test').create(
    AnnotationKind.CLASS,
    'AClass',
  );
  const BClass = new AnnotationFactory('test').create(
    AnnotationKind.CLASS,
    'BClass',
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
    @Aspect('AClassLabel')
    class AAspect {
      @AfterReturn(on.classes.withAnnotations(...aanotations))
      applyAfterReturn(ctxt: AfterReturnContext, ...args: unknown[]): void {
        return afterReturnA1.bind(this)(ctxt, ...args);
      }

      @AfterReturn(on.classes.withAnnotations(...aanotations))
      applyAfterReturn2(ctxt: AfterReturnContext, ...args: unknown[]): void {
        return afterReturnA2.bind(this)(ctxt, ...args);
      }

      @Before(on.classes.withAnnotations(...aanotations))
      applyBefore(ctxt: AfterReturnContext, ...args: unknown[]): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BClassLabel')
    class BAspect {
      @AfterReturn(on.classes.withAnnotations(...bannotations))
      applyAfterReturn(ctxt: AfterReturnContext, ...args: unknown[]): void {
        return afterReturnB.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
  }

  describe('on pointcut @AfterReturn(on.classes.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      @AClass()
      class A {
        constructor(private labels = ['A']) {}
      }

      expect(afterReturnA1).not.toHaveBeenCalled();
      afterReturnA1 = jest.fn(function (this: any) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      new A();
      expect(afterReturnA1).toBeCalled();
    });

    it('calls through each matching advice once', () => {
      @AClass()
      class A {
        constructor(private labels = ['A']) {}
      }
      new A();
      expect(afterReturnA1).toHaveBeenCalledTimes(1);
      expect(afterReturnA2).toHaveBeenCalledTimes(1);
      expect(afterReturnB).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @AfterReturn(on.classes.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AClass], [BClass]);
    });

    it('calls through each matching advice once', () => {
      @AClass()
      class A {
        constructor(private labels = ['A']) {}
      }

      expect(afterReturnA1).not.toHaveBeenCalled();

      new A();
      expect(afterReturnA1).toHaveBeenCalledTimes(1);
      expect(afterReturnA2).toHaveBeenCalledTimes(1);
    });
    it('receives constructor arguments', () => {
      @AClass()
      class A {
        constructor(private labels = ['A']) {}
      }

      expect(afterReturnA1).not.toHaveBeenCalled();
      afterReturnA1 = jest.fn(function (this: any, ctxt: AfterReturnContext) {
        expect(ctxt.args).toEqual([['X']]);
      });

      new A(['X']);
      expect(afterReturnA1).toHaveBeenCalled();
    });

    describe('when the advice returns a new value', () => {
      it('pass that new value to subsequent advices', () => {
        const newValue = {
          labels: ['advised'],
        };
        @AClass()
        class A {
          constructor(private labels = ['A']) {}
        }
        afterReturnA1 = jest.fn(() => {
          return newValue;
        });
        afterReturnA2 = jest.fn((ctxt: AfterReturnContext, value) => {
          expect(value).toBe(newValue);
          expect(ctxt.value).toBe(newValue);
        });
        new A();
        expect(afterReturnA1).toHaveBeenCalled();
        expect(afterReturnA2).toHaveBeenCalled();
      });
    });

    describe('when the advice throws an error', () => {
      it('does not call others @AfterReturn advices', () => {
        const error = new Error('error');
        @AClass()
        class A {}
        afterReturnA1 = jest.fn(() => {
          throw error;
        });
        try {
          new A();
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
        it('creates an object that is an instance of its constructor', () => {
          @AClass()
          class A {
            constructor(public labels = ['A']) {}
          }
          afterReturnA1 = jest.fn(function (
            ctxt: AfterReturnContext<PointcutKind.CLASS, A>,
          ) {
            ctxt.instance.labels = ['B'];
          });

          const a = new A();
          expect(a instanceof A).toBeTrue();
          expect(a.labels).toEqual(['B']);
        });
      });
      describe('an object', () => {
        it('assigns the instance to that object', () => {
          @AClass()
          class A {
            constructor(public labels = ['A']) {}
          }
          afterReturnA1 = jest.fn(function () {
            return {
              labels: ['B'],
            };
          });

          const a = new A();
          expect(a.labels).toEqual(['B']);
        });
      });
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = the class instance', () => {
        @AClass()
        class A {
          constructor(public labels = ['A']) {}
        }
        afterReturnA1 = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();

        expect(thisInstance).toBe(a);
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        @AClass('annotationArg')
        @BClass()
        class A {
          constructor(public labels = ['A']) {}
        }
        afterReturnA1 = jest.fn((ctxt: AfterReturnContext) => {
          expect(ctxt.annotations().find().length).toEqual(2);
          const aclassAnnotationContext = ctxt.annotations(AClass).find()[0]!;
          expect(aclassAnnotationContext).toBeTruthy();
          expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A();
      });

      it('has context.value = the class instance', () => {
        let instance: any;
        @AClass()
        class A {
          constructor(public labels = ['A']) {}
        }
        afterReturnA1 = jest.fn((ctxt: AfterReturnContext, value) => {
          expect(ctxt.instance).toBe(value);
          instance = value;
        });
        const a = new A();
        expect(a).toBe(instance);

        expect(afterReturnA1).toHaveBeenCalled();
      });
    });
  });
});
