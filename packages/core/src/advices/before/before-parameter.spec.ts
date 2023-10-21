import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { Before } from './before.annotation';

import { AdviceError } from '../../errors/advice.error';
import type { PointcutType } from '../../pointcut/pointcut-target.type';
import { WeaverModule } from '../../weaver/weaver.module';
import type { BeforeContext } from './before.context';

describe('parameter advice', () => {
  let aadvice: ReturnType<typeof jest.fn>;
  let badvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mImpl: any;

  const AParameter = new AnnotationFactory('test').create(
    AnnotationType.PARAMETER,
    'AParameter',
  );
  const BParameter = new AnnotationFactory('test').create(
    AnnotationType.PARAMETER,
    'BParameter',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);

    aadvice = jest.fn();
    badvice = jest.fn();
    mImpl = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('AParameterLabel')
    class AAspect {
      @Before(on.parameters.withAnnotations(...aanotations))
      applyBefore(
        ctxt: BeforeContext<PointcutType.PARAMETER>,
        ...args: unknown[]
      ): void {
        return aadvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BParameterLabel')
    class BAspect {
      @Before(on.parameters.withAnnotations(...bannotations))
      applyBefore(
        ctxt: BeforeContext<PointcutType.PARAMETER>,
        ...args: unknown[]
      ): void {
        return badvice.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect, baspect);
  }
  describe('on pointcut @Before(on.parameter.withAnnotations()', () => {
    beforeEach(() => setupAspects());

    it('has a "this"  bound to the aspect instance', () => {
      const mImpl = jest.fn();
      class A {
        m(@AParameter() @BParameter() arg1: any, @AParameter() arg2: any) {
          mImpl(this, arg1, arg2);
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      expect(badvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
      });
      badvice = jest.fn(function (this: any) {
        expect(this).toEqual(baspect);
      });

      new A().m('a', 'b');
      expect(aadvice).toBeCalled();
      expect(badvice).toBeCalled();
    });

    it('calls each matching advice once', () => {
      const mImpl = jest.fn();
      class A {
        m(@AParameter() @BParameter() arg1: any, @AParameter() arg2: any) {
          mImpl(this, arg1, arg2);
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      expect(badvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {});

      new A().m('a', 'b');
      expect(aadvice).toHaveBeenCalledTimes(1);
      expect(badvice).toHaveBeenCalledTimes(1);
      expect(mImpl).toHaveBeenCalledTimes(1);
    });

    describe('when used together with a method decorator', () => {
      it('calls each matching advice once', () => {
        const AMethod = new AnnotationFactory('test').create(
          AnnotationType.METHOD,
          'AMethod',
        );
        const mImpl = jest.fn();
        class A {
          @AMethod()
          m(@AParameter() arg1: any) {
            mImpl(this, arg1);
          }
        }

        expect(aadvice).not.toHaveBeenCalled();
        aadvice = jest.fn(function (this: any) {});

        new A().m('a');
        expect(aadvice).toHaveBeenCalledTimes(1);
        expect(badvice).toHaveBeenCalledTimes(1);
        expect(mImpl).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('on pointcut @Before(on.methods.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => setupAspects([AParameter], [BParameter]));

    it('has a "this"  bound to the aspect instance', () => {
      const mImpl = jest.fn();
      class A {
        m(@AParameter() @BParameter() arg1: any, @AParameter() arg2: any) {
          mImpl(this, arg1, arg2);
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
      });
      badvice = jest.fn(function (this: any) {
        expect(this).toEqual(baspect);
      });

      new A().m('a', 'b');
      expect(aadvice).toBeCalled();
    });

    it('calls through the method once', () => {
      const mImpl = jest.fn();
      class A {
        m(@AParameter() arg1: any, @AParameter() arg2: any) {
          mImpl(this, arg1, arg2);
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {});

      new A().m('a', 'b');
      expect(aadvice).toHaveBeenCalledTimes(1);
      expect(mImpl).toHaveBeenCalledTimes(1);
    });
    it('receives method arguments', () => {
      class A {
        labels: any;
        m(@AParameter() @BParameter() arg1: any, @AParameter() arg2: any) {
          mImpl(this, arg1, arg2);
          this.labels = [arg1, arg2];

          expect(arg1).toBe('a');
          expect(arg2).toBe('b');

          return this;
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (
        this: any,
        ctxt: BeforeContext,
        args: unknown[],
      ) {
        expect(ctxt.args).toEqual(['a', 'b']);
        expect(args).toEqual(['a', 'b']);
      });

      let a = new A();
      a = a.m('a', 'b');
      expect(a.labels).toEqual(['a', 'b']);
    });

    it('is called before the method', () => {
      class A {
        m(@AParameter() @BParameter() arg1?: any, @AParameter() arg2?: any) {
          mImpl(this, arg1, arg2);
        }
      }

      const a = new A();
      expect(aadvice).not.toHaveBeenCalled();
      a.m();
      expect(mImpl).toHaveBeenCalled();
      expect(aadvice).toHaveBeenCalledBefore(mImpl);
    });

    it('is not allowed to return', () => {
      class A {
        m(@AParameter() @BParameter() arg1?: any, @AParameter() arg2?: any) {
          mImpl(this, arg1, arg2);
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {
        return 'x';
      });

      expect(() => new A().m()).toThrowError(AdviceError);

      try {
        new A().m();
      } catch (e: any) {
        expect(
          e.message.indexOf('Returning from advice is not supported'),
        ).toBeGreaterThanOrEqual(0);
      }
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it(`has context.instance = the annotated class's instance`, () => {
        class A {
          m(@AParameter() @BParameter() arg1?: any, @AParameter() arg2?: any) {
            mImpl(this, arg1, arg2);
          }
        }
        aadvice = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        a.m();
        expect(aadvice).toHaveBeenCalled();
        expect(thisInstance).toBe(a);
      });

      it('has context.annotations that contains the annotations for that joinpoint', () => {
        class A {
          m(@AParameter() @BParameter() arg1?: any, @AParameter() arg2?: any) {
            mImpl(this, arg1, arg2);
          }
        }
        aadvice = jest.fn((ctxt: BeforeContext<PointcutType.PARAMETER>) => {
          const aParameterAnnotations = ctxt.annotations
            .filter(AParameter)
            .find();
          const bParameterAnnotations = ctxt.annotations
            .filter(BParameter)
            .find();

          expect(ctxt.annotations.find().length).toEqual(3);
          expect(aParameterAnnotations.length).toEqual(2);

          expect(bParameterAnnotations.length).toEqual(1);
          expect(aParameterAnnotations[0]?.target.eval()).toEqual('b');
          expect(bParameterAnnotations[0]?.target.eval()).toEqual('a');
          expect(aParameterAnnotations[1]?.target.eval()).toEqual('a');
        });
        new A().m('a', 'b');

        expect(aadvice).toHaveBeenCalled();
      });
    });
  });
});
