import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { JitWeaver } from '../../jit/jit-weaver';
import { Aspect } from './../../aspect/aspect.annotation';
import { on } from './../../pointcut/pointcut-expression.factory';
import { weaverContext } from './../../weaver/context/weaver.context.global';
import { Before } from './before.annotation';

import { AdviceError } from '../../errors/advice.error';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { BeforeContext } from './before.context';

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
      @Before(on.classes.withAnnotations(...aanotations))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.CLASS>,
        ...args: unknown[]
      ): void {
        return aadvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BClassLabel')
    class BAspect {
      @Before(on.classes.withAnnotations(...bannotations))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.CLASS>,
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

  describe('on pointcut @Before(on.classes.withAnnotations()', () => {
    beforeEach(() => {
      setupAspects();
    });

    it('has a "this"  bound to the aspect instance', () => {
      @AClass()
      class A {}

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any, _ctxt: BeforeContext<any>) {
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
      aadvice = jest.fn(function (this: any, _ctxt: BeforeContext) {});

      new A();
      expect(aadvice).toHaveBeenCalledTimes(2);
      expect(ctorImpl).toHaveBeenCalledTimes(1);
    });
  });

  describe('on pointcut @Before(on.classes.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AClass], [BClass]);
    });

    it('has a "this"  bound to the aspect instance', () => {
      @AClass()
      class A {}

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {
        expect(this).toBe(aaspect);
      });

      new A();
      expect(aadvice).toHaveBeenCalled();
    });

    it('calls through the advice once', () => {
      @AClass()
      class A {
        constructor() {}
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any, _ctxt: BeforeContext) {});

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
        ctxt: BeforeContext,
        args: unknown[],
      ) {
        expect(ctxt.args).toEqual([['X']]);
        expect(args).toEqual([['X']]);
      });

      const a = new A(['X']);
      expect(a.labels).toEqual(['X']);
    });

    it('is called before the constructor', () => {
      @AClass()
      class A {
        constructor() {
          ctorImpl();
        }
      }

      new A();
      expect(aadvice).toHaveBeenCalled();
      expect(ctorImpl).toHaveBeenCalled();
      expect(aadvice).toHaveBeenCalledBefore(ctorImpl);
    });

    it('is not allowed to return', () => {
      @AClass()
      class A {}

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {
        return 'x';
      });

      expect(() => {
        new A();
      }).toThrowError(AdviceError);

      try {
        new A();
      } catch (e: any) {
        expect(
          e.message.indexOf('Returning from advice is not supported'),
        ).toBeGreaterThanOrEqual(0);
      }
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = null', () => {
        @AClass()
        class A {
          constructor(public labels = ['X']) {}
        }
        aadvice = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        new A();

        expect(thisInstance).toBeNull();
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        @AClass('annotationArg')
        @BClass()
        class A {
          constructor() {}
        }
        aadvice = jest.fn((ctxt: BeforeContext) => {
          expect(ctxt.annotations.find().length).toEqual(2);
          const aclassAnnotationContext = ctxt.annotations
            .filter(AClass)
            .find()[0];
          expect(aclassAnnotationContext).toBeTruthy();
          expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A();
      });

      it('has context.annotation.ref = the annotation that invoked that aspect', () => {
        @AClass()
        class A {
          constructor(public labels = ['X']) {}
        }
        aadvice = jest.fn((ctxt: BeforeContext) => {
          expect(ctxt.annotations.find()[0]?.ref).toBe(AClass.ref);
        });
        new A();

        expect(aadvice).toHaveBeenCalled();
      });
    });
  });
});
