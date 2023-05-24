import 'jest-extended';
import 'jest-extended/all';

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
  let aadvice: ReturnType<typeof jest.fn>;
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

    aadvice = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('AClassLabel')
    class AAspect {
      @Around(on.classes.withAnnotations(...aanotations))
      applyAround(
        ctxt: AroundContext<PointcutTargetType.CLASS>,
        ...args: unknown[]
      ): void {
        return aadvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BClassLabel')
    class BAspect {
      @Around(on.classes.withAnnotations(...bannotations))
      applyAround(
        ctxt: AroundContext<PointcutTargetType.CLASS>,
        ...args: unknown[]
      ): void {
        return aadvice.bind(this)(ctxt, ...args);
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

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any, _ctxt: AroundContext<any>) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      new A();
      expect(aadvice).toBeCalled();
    });

    it('calls through each matching advice once', () => {
      @AClass()
      class A {
        constructor() {
          ctorImpl();
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (
        this: any,
        _ctxt: AroundContext,
        jp: JoinPoint,
        jpArgs: any[],
      ) {
        return jp(jpArgs);
      });

      new A();
      expect(aadvice).toHaveBeenCalledTimes(2);
      expect(ctorImpl).toHaveBeenCalledTimes(1);
    });

    it('creates an object that is an instance of its constructor', () => {
      @AClass()
      class A {}

      expect(new A() instanceof A).toBeTrue();
    });

    describe('when the joinpoint is not called', () => {
      it('does not call through the constructor', () => {
        @AClass()
        class A {}
        aadvice = jest.fn(function (this: any) {});

        const a = new A();
        expect(a instanceof A).toBeTrue();
        expect(ctorImpl).not.toHaveBeenCalled();
        expect(aadvice).toHaveBeenCalled();
      });

      it('creates an object that is an instance of its constructor', () => {
        @AClass()
        class A {}

        expect(new A() instanceof A).toBeTrue();
        expect(aadvice).toHaveBeenCalled();
      });
    });

    describe('when the advice returns a value', () => {
      it('should assign the instance to that value', () => {
        const newInstance = { name: 'newInstance' };
        @AClass()
        class A {}
        aadvice = jest.fn(function (this: any) {
          return newInstance;
        });

        const a = new A();
        expect(aadvice).toHaveBeenCalled();
        expect(a).toBe(newInstance);
      });
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

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any, _ctxt: AroundContext) {});

      new A();
      expect(aadvice).toHaveBeenCalledTimes(1);
    });
    it('receives constructor arguments', () => {
      @AClass()
      class A {
        constructor(public labels = ['A']) {}
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (
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

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = the class instance', () => {
        @AClass()
        class A {
          constructor(public labels = ['X']) {}
        }
        aadvice = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();

        expect(thisInstance).toBe(a);
      });

      it('has context.annotation that contains the proper annotations context', () => {
        @AClass('annotationArg')
        @BClass()
        class A {
          constructor() {}
        }
        aadvice = jest.fn((ctxt: AroundContext) => {
          expect(ctxt.annotations.length).toEqual(2);
          const aclassAnnotationContext = ctxt.annotations.filter(
            (an) => an.ref === AClass.ref,
          )[0];
          expect(aclassAnnotationContext).toBeTruthy();
          expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A();
      });

      it('has context.annotation = the annotation that invoked that aspect', () => {
        @AClass()
        class A {
          constructor(public labels = ['X']) {}
        }
        aadvice = jest.fn((ctxt: AroundContext) => {
          expect(ctxt.annotations[0]?.args).toEqual([]);
          expect(ctxt.annotations[0]?.ref).toBe(AClass.ref);
        });
        new A();

        expect(aadvice).toHaveBeenCalled();
      });
    });
  });
});
