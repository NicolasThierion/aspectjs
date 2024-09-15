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
import { AfterThrow } from '../../public_api';
import { WeaverModule } from '../../weaver/weaver.module';

describe('class advice', () => {
  let afterThrowAdviceA1: ReturnType<typeof jest.fn>;
  let afterThrowAdviceA2: ReturnType<typeof jest.fn>;
  let afterThrowAdviceB: ReturnType<typeof jest.fn>;
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
    @Aspect('AClassLabel')
    class AAspect {
      @AfterThrow(on.classes.withAnnotations(...aanotations))
      applyAfterThrow(ctxt: AfterThrowContext, ...args: unknown[]): void {
        return afterThrowAdviceA1.bind(this)(ctxt, ...args);
      }

      @AfterThrow(on.classes.withAnnotations(...aanotations))
      applyAfterThrow2(ctxt: AfterThrowContext, ...args: unknown[]): void {
        return afterThrowAdviceA2.bind(this)(ctxt, ...args);
      }

      @Before(on.classes.withAnnotations(...aanotations))
      applyBefore(ctxt: AfterThrowContext, ...args: unknown[]): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BClassLabel')
    class BAspect {
      @AfterThrow(on.classes.withAnnotations(...bannotations))
      applyAfterThrow(ctxt: AfterThrowContext, ...args: unknown[]): void {
        return afterThrowAdviceB.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
  }

  describe('on pointcut @AfterThrow(on.classes.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      @AClass()
      class A {
        constructor() {
          throw new Error('original error');
        }
      }

      expect(afterThrowAdviceA1).not.toHaveBeenCalled();
      afterThrowAdviceA1 = jest.fn(function (this: any) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      new A();
      expect(afterThrowAdviceA1).toBeCalled();
    });

    it('calls through each matching advice once', () => {
      @AClass()
      class A {
        constructor() {
          throw new Error('original error');
        }
      }
      try {
        new A();
      } catch (e: any) {
        expect(e.message).toEqual('original error');
      }
      expect(afterThrowAdviceA1).toHaveBeenCalledTimes(1);
      expect(afterThrowAdviceA2).toHaveBeenCalledTimes(1);
      expect(afterThrowAdviceB).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @AfterThrow(on.classes.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AClass], [BClass]);
    });

    it('calls through each matching advice once', () => {
      @AClass()
      class A {
        constructor() {
          throw new Error('original error');
        }
      }

      expect(afterThrowAdviceA1).not.toHaveBeenCalled();

      try {
        new A();
      } catch (err: any) {
        expect(err.message).toEqual('original error');
      }
      expect(afterThrowAdviceA1).toHaveBeenCalledTimes(1);
      expect(afterThrowAdviceA2).toHaveBeenCalledTimes(1);
    });
    it('receives constructor arguments', () => {
      @AClass()
      class A {
        constructor(public labels = ['A']) {
          throw new Error('original error');
        }
      }

      expect(afterThrowAdviceA1).not.toHaveBeenCalled();
      afterThrowAdviceA1 = jest.fn(function (
        this: any,
        ctxt: AfterThrowContext,
      ) {
        expect(ctxt.args).toEqual([['X']]);
      });

      new A(['X']);
      expect(afterThrowAdviceA1).toHaveBeenCalled();
    });

    describe('when the advice does not throw', () => {
      it('does not call other @AfterThrow advices', () => {
        @AClass()
        class A {
          constructor() {
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn();
        afterThrowAdviceA2 = jest.fn();
        new A();
        expect(afterThrowAdviceA1).toHaveBeenCalled();
        expect(afterThrowAdviceA2).not.toHaveBeenCalled();
      });
    });

    describe('when the advice throws an error', () => {
      it('call others @AfterThrow advices', () => {
        @AClass()
        class A {
          constructor() {
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn(() => {
          throw new Error('advised error');
        });
        afterThrowAdviceA2 = jest.fn((ctxt: AfterThrowContext) => {
          expect((ctxt.error as any).message).toEqual('advised error');
        });
        new A();
        expect(afterThrowAdviceA1).toHaveBeenCalled();
        expect(afterThrowAdviceA2).toHaveBeenCalled();
      });
    });

    describe('when the advice returns', () => {
      describe('undefined', () => {
        it('creates an object that is an instance of its constructor', () => {
          @AClass()
          class A {
            labels: string[] = [];
            constructor() {
              this.labels = ['A'];
              throw new Error('original error');
            }
          }
          afterThrowAdviceA1 = jest.fn(function (
            ctxt: AfterThrowContext<PointcutKind.CLASS, A>,
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
            labels: string[] = [];
            constructor() {
              this.labels = ['A'];
              throw new Error('original error');
            }
          }
          afterThrowAdviceA1 = jest.fn(function () {
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
          constructor(public labels = ['X']) {
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();

        expect(thisInstance).toBe(a);
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        @AClass('annotationArg')
        @BClass()
        class A {
          constructor() {
            throw new Error('original error');
          }
        }
        afterThrowAdviceA1 = jest.fn((ctxt: AfterThrowContext) => {
          expect(ctxt.annotations().find().length).toEqual(2);
          const aclassAnnotationContext = ctxt.annotations(AClass).find()[0];
          expect(aclassAnnotationContext).toBeTruthy();
          expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A();
      });

      it('has context.error = the error that has been throws', () => {
        const e = new Error('original error');
        @AClass()
        class A {
          constructor(public labels = ['X']) {
            throw e;
          }
        }
        afterThrowAdviceA1 = jest.fn((ctxt: AfterThrowContext, err) => {
          expect(ctxt.error).toBe(e);
          expect(err).toBe(e);
        });
        new A();

        expect(afterThrowAdviceA1).toHaveBeenCalled();
      });
    });
  });
});
