import { AnnotationFactory } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import { abstract } from '@aspectjs/common/utils';
import { Aspect } from '../aspect/aspect.annotation';
import { on } from '../pointcut/pointcut-expression.factory';
import {
  AfterReturnContext,
  Around,
  Before,
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
      let x: { m: () => any };
      beforeEach(() => {
        const InterceptReturn = new AnnotationFactory('test').create(
          'InterceptReturn',
        );
        class X {
          @InterceptReturn()
          m() {
            return abstract<object>();
          }
        }

        configureTesting(WeaverModule);

        @Aspect()
        class InterceptAbstractReturnAspect {
          @AfterReturn(on.methods.withAnnotations(InterceptReturn))
          protected interceptAbstractReturn(ctxt: AfterReturnContext) {
            return 'intercepted value';
          }
        }
        getWeaver().enable(new InterceptAbstractReturnAspect());
        x = new X();
      });
      it('does not throw', () => {
        expect(() => x.m()).not.toThrow();
      });

      it('is supersed by the return value of the AfterReturn advice', () => {
        expect(x.m()).toEqual('intercepted value');
      });
    });

    describe('that is advised with a @Around advice', () => {
      let x: { m: () => any };
      beforeEach(() => {
        const InterceptReturn = new AnnotationFactory('test').create(
          'InterceptReturn',
        );
        class X {
          @InterceptReturn()
          m() {
            return abstract<object>();
          }
        }

        configureTesting(WeaverModule);

        @Aspect()
        class InterceptAbstractReturnAspect {
          @Around(on.methods.withAnnotations(InterceptReturn))
          protected interceptAbstractReturn(ctxt: AfterReturnContext) {
            return 'intercepted value';
          }
        }
        getWeaver().enable(new InterceptAbstractReturnAspect());
        x = new X();
      });
      it('does not throw', () => {
        expect(() => x.m()).not.toThrow();
      });

      it('is supersed by the return value of the AfterReturn advice', () => {
        expect(x.m()).toEqual('intercepted value');
      });
    });

    describe('that is advised with an advice other than @AfterReturn or @Around', () => {
      let x: { m: () => any };
      beforeEach(() => {
        const NoInterceptReturn = new AnnotationFactory('test').create(
          'NoInterceptReturn',
        );
        class X {
          @NoInterceptReturn()
          m() {
            return abstract<object>();
          }
        }

        configureTesting(WeaverModule);

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
