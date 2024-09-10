import { AnnotationFactory } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import { abstract, assert } from '@aspectjs/common/utils';
import { Aspect } from '../aspect/aspect.annotation';
import { on } from '../pointcut/pointcut-expression.factory';
import {
  AfterReturnContext,
  Around,
  AroundContext,
  Before,
  Order,
  WeavingError,
} from '../public_api';
import { getWeaver } from '../weaver/context/weaver.context.global';
import { WeaverModule } from '../weaver/weaver.module';
import { AfterReturn } from './after-return/after-return.annotation';

describe('"abstract()" value placeholder', () => {
  describe('when used as a return value of a method', () => {
    it('throws an error', () => {
      class X {
        m() {
          return abstract<object>();
        }
      }

      expect(() => new X().m()).toThrow();
    });

    describe('that is advised with a @AfterReturn advice', () => {
      let x: { m: (...args: any[]) => any };
      let parameterAdvice = jest.fn();
      beforeEach(() => {
        const af = new AnnotationFactory('test');

        const InterceptReturn = af.create('InterceptReturn');
        const NoInterceptReturn = af.create('NoInterceptReturn');
        parameterAdvice = jest.fn();

        configureTesting(WeaverModule);

        @Aspect()
        class InterceptAbstractReturnAspect {
          @AfterReturn(on.methods.withAnnotations(InterceptReturn))
          protected interceptAbstractReturn(ctxt: AfterReturnContext) {
            return 'intercepted value';
          }

          @Before(on.parameters.withAnnotations(NoInterceptReturn))
          protected noInterceptAbstractReturn(ctxt: AfterReturnContext) {
            parameterAdvice(ctxt);
          }
        }
        getWeaver().enable(new InterceptAbstractReturnAspect());
        class X {
          @InterceptReturn()
          m(@NoInterceptReturn() arg?: any) {
            return abstract<object>();
          }
        }

        x = new X();
      });
      it('does not throw', () => {
        expect(() => x.m()).not.toThrow();
        expect(parameterAdvice).toHaveBeenCalled();
      });

      it('is supersed by the return value of the AfterReturn advice', () => {
        expect(x.m()).toEqual('intercepted value');
      });
    });

    describe('that is advised with a @Around advice', () => {
      let x: { m: (...args: any[]) => any };
      beforeEach(() => {
        configureTesting(WeaverModule);
        const af = new AnnotationFactory('test');
        const InterceptReturn = af.create('InterceptReturn');
        const A = af.create('A');

        class X {
          @InterceptReturn()
          m(@A() param: string) {
            return abstract<object>();
          }
        }

        const _interceptAbstractReturnAspect = getWeaver().getAspects();
        assert(!_interceptAbstractReturnAspect.length);

        @Aspect()
        class InterceptAbstractReturnAspect {
          @Before(on.parameters.withAnnotations(A))
          protected parameterAdvice(ctxt: AroundContext) {}

          @Order(1)
          @Around(on.methods.withAnnotations(InterceptReturn))
          protected interceptAbstractReturn(ctxt: AroundContext) {
            return 'intercepted value';
          }

          @Order(2)
          @Around(on.methods.withAnnotations(InterceptReturn))
          protected noInterceptAbstractReturn(ctxt: AroundContext) {
            return ctxt.joinpoint(...ctxt.args);
          }
        }

        getWeaver().enable(new InterceptAbstractReturnAspect());
        x = new X();
      });
      it('does not throw', () => {
        expect(() => x.m('x')).not.toThrow();
      });

      it('is supersed by the return value of the AfterReturn advice', () => {
        expect(x.m()).toEqual('intercepted value');
      });
    });

    describe('that is advised with an advice other than @AfterReturn or @Around', () => {
      let x: { m: () => any };
      beforeEach(() => {
        configureTesting(WeaverModule);

        const NoInterceptReturn = new AnnotationFactory('test').create(
          'NoInterceptReturn',
        );
        class X {
          @NoInterceptReturn()
          m() {
            return abstract<object>();
          }
        }

        @Aspect()
        class NoInterceptAbstractReturnAspect {
          @Before(on.methods.withAnnotations(NoInterceptReturn))
          protected interceptAbstractReturn(ctxt: AfterReturnContext) {}
        }
        getWeaver().enable(new NoInterceptAbstractReturnAspect());
        x = new X();
      });
      it('throws an error', () => {
        expect(() => x.m()).toThrow(
          new WeavingError(
            'method X.m returned "abstract()" token. "abstract()" is meant to be superseded by a @AfterReturn advice or an @Around advice.',
          ),
        );
      });
    });
  });
});
