import 'jest-extended';
import 'jest-extended/all';
import { WeavingError } from './../../errors/weaving.error';
import { Before } from './../before/before.annotation';

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

describe('class advice', () => {
  let aroundAdviceA: ReturnType<typeof jest.fn>;
  let aroundAdviceB: ReturnType<typeof jest.fn>;
  let beforeAdvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  let ctorImpl: any;
  const AClass = new AnnotationFactory('test').create(
    AnnotationType.CLASS,
    'AClass',
  );
  const BClass = new AnnotationFactory('test').create(
    AnnotationType.CLASS,
    'BClass',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);

    aroundAdviceA = jest.fn((c: AroundContext) => c.joinpoint(...c.args));
    aroundAdviceB = jest.fn((c: AroundContext) => c.joinpoint(...c.args));
    beforeAdvice = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('AClassLabel')
    class AAspect {
      @Around(on.classes.withAnnotations(...aanotations))
      applyAround(
        ctxt: AroundContext<PointcutTargetType.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA.bind(this)(ctxt, ...args);
      }

      @Around(on.classes.withAnnotations(...aanotations))
      applyAround2(
        ctxt: AroundContext<PointcutTargetType.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceB.bind(this)(ctxt, ...args);
      }

      @Before(on.classes.withAnnotations(...aanotations))
      applyBefore(
        ctxt: AroundContext<PointcutTargetType.CLASS>,
        ...args: unknown[]
      ): void {
        return beforeAdvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BClassLabel')
    class BAspect {
      @Around(on.classes.withAnnotations(...bannotations))
      applyAround(
        ctxt: AroundContext<PointcutTargetType.CLASS>,
        ...args: unknown[]
      ): void {
        return aroundAdviceA.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
    ctorImpl = jest.fn();
  }

  describe('on pointcut @Around(on.classes.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      @AClass()
      class A {}

      expect(aroundAdviceA).not.toHaveBeenCalled();
      aroundAdviceA = jest.fn(function (this: any, _ctxt: AroundContext<any>) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      new A();
      expect(aroundAdviceA).toBeCalled();
    });

    it('calls through each matching advice once', () => {
      @AClass()
      class A {
        constructor() {
          ctorImpl();
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

      new A();
      expect(aroundAdviceA).toHaveBeenCalledTimes(2);
      expect(ctorImpl).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @Around(on.classes.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AClass], [BClass]);
    });

    it('calls through the advice once', () => {
      @AClass()
      class A {
        constructor() {}
      }

      expect(aroundAdviceA).not.toHaveBeenCalled();
      aroundAdviceA = jest.fn(function (this: any, _ctxt: AroundContext) {});

      new A();
      expect(aroundAdviceA).toHaveBeenCalledTimes(1);
    });
    it('receives constructor arguments', () => {
      @AClass()
      class A {
        constructor(public labels = ['A']) {}
      }

      expect(aroundAdviceA).not.toHaveBeenCalled();
      aroundAdviceA = jest.fn(function (
        this: any,
        ctxt: AroundContext,
        jp: JoinPoint,
        jpArgs: unknown[],
      ) {
        expect(ctxt.args).toEqual([['X']]);
        expect(ctxt.joinpoint).toBe(jp);
        jp(...jpArgs);
      });

      const a = new A(['X']);
      expect(a.labels).toEqual(['X']);
    });

    it('creates an object that is an instance of its constructor', () => {
      @AClass()
      class A {}

      expect(new A() instanceof A).toBeTrue();
    });

    describe('when the joinpoint is not called', () => {
      beforeEach(() => {
        aroundAdviceA = jest.fn(function (this: any) {});
      });
      it('does not call through the constructor', () => {
        @AClass()
        class A {}

        const a = new A();
        expect(a instanceof A).toBeTrue();
        expect(ctorImpl).not.toHaveBeenCalled();
        expect(aroundAdviceA).toHaveBeenCalled();
      });

      it('creates an object that is an instance of its constructor', () => {
        @AClass()
        class A {}

        expect(new A() instanceof A).toBeTrue();
        expect(aroundAdviceA).toHaveBeenCalled();
      });
    });

    describe('when the joinpoint is called', () => {
      describe('once', () => {
        beforeEach(() => {
          aroundAdviceA = jest.fn(
            (ctxt: AroundContext<PointcutTargetType.CLASS>) => {
              return ctxt.joinpoint(...ctxt.args);
            },
          );
        });
        it('calls the aspect around the constructor', () => {
          @AClass()
          class A {
            constructor() {
              ctorImpl();
            }
          }

          new A();
          expect(beforeAdvice).toHaveBeenCalled();
          expect(aroundAdviceA).toHaveBeenCalled();
          expect(ctorImpl).toHaveBeenCalled();
          expect(beforeAdvice).toHaveBeenCalledBefore(ctorImpl);
          expect(aroundAdviceA).toHaveBeenCalledBefore(beforeAdvice);
        });
      });
      describe('twice', () => {
        beforeEach(() => {
          aroundAdviceA = jest.fn((ctxt: AroundContext, jp: JoinPoint) => {
            jp();
            jp();
          });
        });
        it('throws an error', () => {
          @AClass()
          class A {}

          expect(() => new A()).toThrow(
            new WeavingError(
              'Error applying advice @Around(@test:AClass) AAspect.applyAround() on class "A": joinPoint already proceeded',
            ),
          );
        });
      });
    });

    describe('when the advice returns a value', () => {
      it('assigns the instance to that value', () => {
        const newInstance = { name: 'newInstance' };
        @AClass()
        class A {}
        aroundAdviceA = jest.fn(function (this: any) {
          return newInstance;
        });

        const a = new A();
        expect(aroundAdviceA).toHaveBeenCalled();
        expect(a).toBe(newInstance);
      });
    });

    describe('when multiple "around" advices are configured', () => {
      describe('and the joinpoint has been called', () => {
        let labels: string[];
        beforeEach(() => {
          labels = [];

          aroundAdviceA = jest.fn((ctxt: AroundContext) => {
            labels.push('beforeA');
            ctxt.joinpoint('A');
            labels.push('afterA');
          });
          aroundAdviceB = jest.fn((ctxt: AroundContext) => {
            labels.push('beforeB');
            ctxt.joinpoint('B');
            labels.push('afterB');
          });
        });
        it('calls them nested, in declaration order', () => {
          @AClass()
          class A {
            constructor(label: string) {
              labels.push(label);
            }
          }

          new A('ctor');
          expect(labels).toEqual([
            'beforeB',
            'beforeA',
            'A',
            'afterA',
            'afterB',
          ]);
        });
      });
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = the class instance', () => {
        @AClass()
        class A {
          constructor(public labels = ['X']) {}
        }
        aroundAdviceA = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();

        expect(thisInstance).toBe(a);
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        @AClass('annotationArg')
        @BClass()
        class A {
          constructor() {}
        }
        aroundAdviceA = jest.fn((ctxt: AroundContext) => {
          expect(ctxt.annotations.length).toEqual(2);
          const aclassAnnotationContext = ctxt.annotations.filter(
            (an) => an.ref === AClass.ref,
          )[0];
          expect(aclassAnnotationContext).toBeTruthy();
          expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A();
      });
    });
  });
});
