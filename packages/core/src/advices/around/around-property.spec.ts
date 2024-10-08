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

describe('property advice', () => {
  let aroundAdviceA: ReturnType<typeof jest.fn>;
  let aroundAdviceB: ReturnType<typeof jest.fn>;
  let beforeAdvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  let getterImpl: any;
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

    aroundAdviceA = jest.fn((c: AroundContext) => c.joinpoint(...c.args));
    aroundAdviceB = jest.fn((c: AroundContext) => c.joinpoint(...c.args));
    beforeAdvice = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('APropertyLabel')
    class AAspect {
      @Around(on.properties.withAnnotations(...aanotations))
      applyAround(
        ctxt: AroundContext<PointcutKind.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA.bind(this)(ctxt, ...args);
      }

      @Around(on.properties.withAnnotations(...aanotations))
      applyAround2(
        ctxt: AroundContext<PointcutKind.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceB.bind(this)(ctxt, ...args);
      }

      @Before(on.properties.withAnnotations(...aanotations))
      applyBefore(
        ctxt: AroundContext<PointcutKind.CLASS>,
        ...args: unknown[]
      ): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BPropertyLabel')
    class BAspect {
      @Around(on.properties.withAnnotations(...bannotations))
      applyAround(
        ctxt: AroundContext<PointcutKind.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
    getterImpl = jest.fn();
  }

  describe('on pointcut @Around(on.properties.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        @AProperty()
        declare labels: string[];
        constructor() {
          this.labels = ['a'];
        }
      }

      expect(aroundAdviceA).not.toHaveBeenCalled();
      aroundAdviceA = jest.fn(function (this: any, _ctxt: AroundContext<any>) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      new A().labels;
      expect(aroundAdviceA).toBeCalled();
    });

    it('calls through each matching advice once', () => {
      class A {
        @AProperty()
        get labels() {
          getterImpl();
          return ['a'];
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

      new A().labels;
      expect(aroundAdviceA).toHaveBeenCalledTimes(2);
      expect(getterImpl).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @Around(on.properties.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AProperty], [BProperty]);
    });

    it('calls through the advice once', () => {
      class A {
        @AProperty()
        declare labels: string[];
        constructor() {
          this.labels = ['a'];
        }
      }

      expect(aroundAdviceA).not.toHaveBeenCalled();
      aroundAdviceA = jest.fn(function (this: any, _ctxt: AroundContext) {});

      new A().labels;
      expect(aroundAdviceA).toHaveBeenCalledTimes(1);
    });

    describe('when the joinpoint is not called', () => {
      beforeEach(() => {
        aroundAdviceA = jest.fn(function (this: any) {});
      });
      it('does not call through the getter', () => {
        class A {
          @AProperty()
          get labels() {
            getterImpl();
            return ['a'];
          }
        }

        new A().labels;
        expect(getterImpl).not.toHaveBeenCalled();
        expect(aroundAdviceA).toHaveBeenCalled();
      });

      it('returns undefined', () => {
        class A {
          @AProperty()
          declare labels: string[];

          constructor() {
            this.labels = ['a'];
          }
        }

        const a = new A();
        expect(a.labels).toBe(undefined);
        expect(aroundAdviceA).toHaveBeenCalled();
      });
    });

    describe('when the joinpoint is called', () => {
      beforeEach(() => {
        aroundAdviceA = jest.fn((ctxt: AroundContext<PointcutKind.CLASS>) => {
          return ctxt.joinpoint(...ctxt.args);
        });
      });
      it('calls the aspect around the getter', () => {
        class A {
          @AProperty()
          get labels() {
            getterImpl();
            return ['a'];
          }
        }

        new A().labels;
        expect(beforeAdvice).toHaveBeenCalled();
        expect(aroundAdviceA).toHaveBeenCalled();
        expect(getterImpl).toHaveBeenCalled();
        expect(beforeAdvice).toHaveBeenCalledBefore(getterImpl);
        expect(aroundAdviceA).toHaveBeenCalledBefore(beforeAdvice);
      });
    });

    describe('when the advice returns a value', () => {
      it('replaces the property value', () => {
        const newVal = 'newVal';
        class A {
          @AProperty()
          declare labels: string[];
          constructor() {
            this.labels = ['a'];
          }
        }
        aroundAdviceA = jest.fn(function (this: any) {
          return newVal;
        });

        const a = new A().labels;
        expect(aroundAdviceA).toHaveBeenCalled();
        expect(a).toBe(newVal);
      });
    });

    it('does not interfere with property setter', () => {
      class A {
        @AProperty()
        declare labels: string[];
        constructor() {
          this.labels = ['a'];
        }
      }

      const a = new A();
      a.labels = a.labels.concat('b');
      expect(a.labels).toEqual(['a', 'b']);
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
            @AProperty()
            declare labels: string[];

            constructor() {
              this.labels = ['a'];
            }
          }

          new A().labels;
          expect(labels).toEqual(['beforeA', 'beforeB', 'afterB', 'afterA']);
        });
      });
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = the class instance', () => {
        class A {
          @AProperty()
          declare labels: string[];
          constructor() {
            this.labels = ['a'];
          }
        }
        aroundAdviceA = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        a.labels;

        expect(thisInstance).toBe(a);
        expect(aroundAdviceA).toHaveBeenCalled();
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          @AProperty('annotationArg')
          @BProperty()
          labels = ['a'];
        }
        aroundAdviceA = jest.fn((ctxt: AroundContext) => {
          expect(ctxt.annotations().find().length).toEqual(2);
          const aPropertyAnnotationContext = ctxt
            .annotations(AProperty)
            .find()[0];
          expect(aPropertyAnnotationContext).toBeTruthy();
          expect(aPropertyAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A().labels;
      });
    });
  });
});
