import 'jest-extended';
import 'jest-extended/all';
import { Before } from '../before/before.annotation';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';

import type { JoinpointType } from '../../pointcut/pointcut-target.type';
import { JoinPoint } from '../../public_api';
import { WeaverModule } from '../../weaver/weaver.module';
import { Around } from './around.annotation';
import { AroundContext } from './around.context';

describe('property setter advice', () => {
  let aroundAdviceA: ReturnType<typeof jest.fn>;
  let aroundAdviceA2: ReturnType<typeof jest.fn>;
  let aroundAdviceB: ReturnType<typeof jest.fn>;
  let beforeAdvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  let setterImpl: any;
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

    aroundAdviceA = jest.fn((c: AroundContext) => {
      return c.joinpoint(...c.args);
    });
    aroundAdviceA2 = jest.fn((c: AroundContext) => {
      return c.joinpoint(...c.args);
    });
    aroundAdviceB = jest.fn((c: AroundContext) => {
      return c.joinpoint(...c.args);
    });
    beforeAdvice = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('APropertyLabel')
    class AAspect {
      @Around(on.properties.setter.withAnnotations(...aanotations))
      applyAround(
        ctxt: AroundContext<JoinpointType.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA.bind(this)(ctxt, ...args);
      }

      @Around(on.properties.setter.withAnnotations(...aanotations))
      applyAround2(
        ctxt: AroundContext<JoinpointType.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA2.bind(this)(ctxt, ...args);
      }

      @Before(on.properties.setter.withAnnotations(...aanotations))
      applyBefore(
        ctxt: AroundContext<JoinpointType.CLASS>,
        ...args: unknown[]
      ): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BPropertyLabel')
    class BAspect {
      @Around(on.properties.setter.withAnnotations(...bannotations))
      applyAround(
        ctxt: AroundContext<JoinpointType.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceB.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
    setterImpl = jest.fn();
  }

  describe('on pointcut @Around(on.properties.setter.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        @AProperty()
        labels = ['a'];
      }

      aroundAdviceA = jest.fn(function (this: any) {
        expect(this === aaspect).toBeTrue();
      });

      expect(aroundAdviceA).not.toHaveBeenCalled();

      new A();
      expect(aroundAdviceA).toBeCalledTimes(1);
    });

    it('calls through each matching advice once', () => {
      class A {
        @AProperty()
        labels: any;
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

      const a = new A();
      a.labels = ['a'];
      a.labels = a.labels.concat('b');
      expect(a.labels).toEqual(['a', 'b']);
      expect(aroundAdviceA).toHaveBeenCalledTimes(2);
      expect(aroundAdviceB).toHaveBeenCalledTimes(2);
    });
  });

  describe('on pointcut @Around(on.properties.setter.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AProperty], [BProperty]);
    });

    it('calls through the advice once', () => {
      class A {
        @AProperty()
        labels = ['a'];
      }

      expect(aroundAdviceA).not.toHaveBeenCalled();

      aroundAdviceA = jest.fn(function (this: any, _ctxt: AroundContext) {});

      const a = new A();
      aroundAdviceA = jest.fn(function (this: any, _ctxt: AroundContext) {});
      a.labels = ['a', 'b'];

      expect(aroundAdviceA).toHaveBeenCalledTimes(1);
    });

    describe('when the joinpoint is not called', () => {
      beforeEach(() => {
        aroundAdviceA = jest.fn(function (this: any) {});
      });
      it('does not call through the setter', () => {
        class A {
          @AProperty()
          set labels(val: string[]) {
            setterImpl(val);
          }
        }

        const a = new A();

        a.labels = ['a'];
        expect(setterImpl).not.toHaveBeenCalled();
        expect(aroundAdviceA).toHaveBeenCalled();
      });

      it('does not set the property', () => {
        class A {
          @AProperty()
          labels = ['a'];
        }

        const a = new A();
        expect(a.labels).toBe(undefined);
        expect(aroundAdviceA).toHaveBeenCalled();
      });
    });

    describe('when the joinpoint is called', () => {
      beforeEach(() => {
        aroundAdviceA = jest.fn((ctxt: AroundContext<JoinpointType.CLASS>) => {
          return ctxt.joinpoint(...ctxt.args);
        });
      });
      it('calls the aspect around the getter', () => {
        class A {
          @AProperty()
          set labels(val: string[]) {
            setterImpl(val);
          }
        }

        new A().labels = ['a'];
        expect(beforeAdvice).toHaveBeenCalled();
        expect(aroundAdviceA).toHaveBeenCalled();
        expect(setterImpl).toHaveBeenCalled();
        expect(beforeAdvice).toHaveBeenCalledBefore(setterImpl);
        expect(aroundAdviceA).toHaveBeenCalledBefore(beforeAdvice);
      });
    });

    it('does not interfere with property getter', () => {
      class A {
        @AProperty()
        labels = ['a'];
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
            ctxt.joinpoint('a');
            labels.push('afterA');
          });
          aroundAdviceB = jest.fn((ctxt: AroundContext) => {
            labels.push('beforeB');
            ctxt.joinpoint('b');
            labels.push('afterB');
          });
        });
        it('should call them nested, in declaration order', () => {
          class A {
            @AProperty()
            @BProperty()
            labels = ['a'];
          }

          new A();
          expect(labels).toEqual(['beforeA', 'beforeB', 'afterB', 'afterA']);
        });
      });
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = the class instance', () => {
        class A {
          @AProperty()
          labels = ['a'];
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
          expect(ctxt.annotations.find().length).toEqual(2);
          const aPropertyAnnotationContext = ctxt.annotations
            .filter(AProperty)
            .find()[0];
          expect(aPropertyAnnotationContext).toBeTruthy();
          expect(aPropertyAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A().labels;
      });
    });
  });
});
