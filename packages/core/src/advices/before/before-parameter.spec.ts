import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { weaverContext } from '../../weaver/context/weaver.context.global';
import { Before } from './before.annotation';

import { AdviceError } from '../../errors/advice.error';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { BeforeContext } from './before.context';

describe('parameter advice', () => {
  let advice: ReturnType<typeof jest.fn>;
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
    const context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);

    advice = jest.fn();
    mImpl = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('AParameterLabel')
    class AAspect {
      @Before(on.parameters.withAnnotations(...aanotations))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.PARAMETER>,
        ...args: unknown[]
      ): void {
        return advice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BParameterLabel')
    class BAspect {
      @Before(on.parameters.withAnnotations(...bannotations))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.PARAMETER>,
        ...args: unknown[]
      ): void {
        return advice.bind(this)(ctxt, ...args);
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

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
      });

      new A().m('a', 'b');
      expect(advice).toBeCalled();
    });

    it('calls each matching advice once', () => {
      const mImpl = jest.fn();
      class A {
        m(@AParameter() @BParameter() arg1: any, @AParameter() arg2: any) {
          mImpl(this, arg1, arg2);
        }
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {});

      new A().m('a', 'b');
      expect(advice).toHaveBeenCalledTimes(2);
      expect(mImpl).toHaveBeenCalledTimes(1);
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

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
      });

      new A().m('a', 'b');
      expect(advice).toBeCalled();
    });

    it('calls through the method once', () => {
      const mImpl = jest.fn();
      class A {
        m(@AParameter() arg1: any, @AParameter() arg2: any) {
          mImpl(this, arg1, arg2);
        }
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {});

      new A().m('a', 'b');
      expect(advice).toHaveBeenCalledTimes(1);
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

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (
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
      expect(advice).not.toHaveBeenCalled();
      a.m();
      expect(mImpl).toHaveBeenCalled();
      expect(advice).toHaveBeenCalledBefore(mImpl);
    });

    it('is not allowed to return', () => {
      class A {
        m(@AParameter() @BParameter() arg1?: any, @AParameter() arg2?: any) {
          mImpl(this, arg1, arg2);
        }
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
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
        advice = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        a.m();
        expect(advice).toHaveBeenCalled();
        expect(thisInstance).toBe(a);
      });

      it('has context.annotations that contains the proper annotations context', () => {
        class A {
          m(@AParameter() @BParameter() arg1?: any, @AParameter() arg2?: any) {
            mImpl(this, arg1, arg2);
          }
        }
        advice = jest.fn(
          (ctxt: BeforeContext<PointcutTargetType.PARAMETER>) => {
            expect(ctxt.annotations.length).toEqual(3);
            expect(
              ctxt.annotations
                .map((a) => a.ref)
                .filter((r) => r === AParameter.ref).length,
            ).toEqual(2);

            expect(
              ctxt.annotations
                .map((a) => a.ref)
                .filter((r) => r === BParameter.ref).length,
            ).toEqual(1);

            ctxt.annotations
              .filter((a) => a!.target.parameterIndex === 0)
              .forEach((a) => {
                expect(a.value).toEqual('a');
              });

            ctxt.annotations
              .filter((a) => a!.target.parameterIndex === 1)
              .forEach((a) => {
                expect(a.value).toEqual('b');
              });
          },
        );
        new A().m('a', 'b');

        expect(advice).toHaveBeenCalled();
      });
    });
  });
});
