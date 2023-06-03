import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { weaverContext } from '../../weaver/context/weaver.context.global';

import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import { Around } from './around.annotation';
import { AroundContext } from './around.context';

describe('@Around advice', () => {
  describe('when combined on multiple pointcuts', () => {
    let aroundAdvice: ReturnType<typeof jest.fn>;
    let aaspect: any;
    const AAnnotation = new AnnotationFactory('test').create('AAnnotation');
    const BAnnotation = new AnnotationFactory('test').create('BAnnotation');
    let weaver: JitWeaver;
    beforeEach(() => {
      const context = configureTesting(weaverContext());
      weaver = context.get(JitWeaver);

      aroundAdvice = jest.fn((c: AroundContext) => c.joinpoint(...c.args));

      @Aspect('AClassLabel')
      class AAspect {
        @Around(on.classes.withAnnotations(BAnnotation, AAnnotation))
        @Around(on.classes.withAnnotations(AAnnotation))
        applyAround(
          ctxt: AroundContext<PointcutTargetType.CLASS>,
          ...args: unknown[]
        ): void {
          return aroundAdvice.bind(this)(ctxt, ...args);
        }
      }

      aaspect = new AAspect();
      weaver.enable(aaspect);
    });

    describe('calling an advised class', () => {
      it('calls through the advice', () => {
        @AAnnotation()
        class A {}
        expect(aroundAdvice).not.toHaveBeenCalled();

        new A();
        expect(aroundAdvice).toHaveBeenCalled();

        aroundAdvice = jest.fn();
        @BAnnotation()
        class B {}
        expect(aroundAdvice).not.toHaveBeenCalled();

        new B();
        expect(aroundAdvice).toHaveBeenCalled();
      });

      describe('when several pointcuts match the method', () => {
        it('calls through the advice once', () => {
          @AAnnotation()
          @BAnnotation()
          class A {}
          expect(aroundAdvice).not.toHaveBeenCalled();

          new A();
          expect(aroundAdvice).toHaveBeenCalledOnce();
        });
      });
    });
  });
});
