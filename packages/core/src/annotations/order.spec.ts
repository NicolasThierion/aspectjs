import { AroundContext, JoinPoint } from '@aspectjs/core';
import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import { Before } from '../advices/before/before.annotation';
import { Aspect } from '../aspect/aspect.annotation';
import { JitWeaver } from '../jit/jit-weaver';
import { on } from '../pointcut/pointcut-expression.factory';
import { Around } from '../public_api';
import { WeaverModule } from '../weaver/weaver.module';
import { Weaver } from './../weaver/weaver';
import { Order } from './order.annotation';

const Annotation0 = new AnnotationFactory('test').create('Annotation0');
const AnnotationX = new AnnotationFactory('test').create('AnnotationX');

describe('@Order(<PRECEDENCE>) annotation', () => {
  let beforeAdvice0 = jest.fn();
  let beforeAdviceX = jest.fn();
  let aroundAdvice0 = jest.fn();
  let aroundAdviceX = jest.fn();
  let aspect0: any, aspectX: any;
  let weaver: Weaver;
  beforeEach(() => {
    const context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);
    beforeAdvice0 = jest.fn();
    beforeAdviceX = jest.fn();
    aroundAdvice0 = jest.fn(
      (ctxt: AroundContext, jp: JoinPoint, args: unknown[]) => {
        return jp(...args);
      },
    );
    aroundAdviceX = jest.fn(
      (ctxt: AroundContext, jp: JoinPoint, args: unknown[]) => {
        return jp(...args);
      },
    );

    @Aspect()
    @Order(0)
    class Aspect0 {
      @Before(on.methods.withAnnotations(Annotation0))
      applyBefore0() {
        beforeAdvice0();
      }
      @Around(on.methods.withAnnotations(Annotation0))
      applyAround0(...args: any[]) {
        aroundAdvice0(...args);
      }
    }

    @Aspect()
    class AspectX {
      @Before(on.methods.withAnnotations(AnnotationX))
      applyBeforeX() {
        beforeAdviceX();
      }
      @Around(on.methods.withAnnotations(AnnotationX))
      applyAroundX(...args: any[]) {
        aroundAdviceX(...args);
      }
    }

    aspect0 = new Aspect0();
    aspectX = new AspectX();
  });

  describe('on an aspect class', () => {
    it('calls the advices with a higher precedence than aspects not annotated with the @Order annotation', () => {
      weaver.enable(aspectX, aspect0);

      class A {
        @AnnotationX()
        @Annotation0()
        m() {}
      }

      expect(beforeAdvice0).not.toHaveBeenCalled();
      expect(beforeAdviceX).not.toHaveBeenCalled();
      expect(aroundAdvice0).not.toHaveBeenCalled();
      expect(aroundAdviceX).not.toHaveBeenCalled();
      new A().m();

      expect(beforeAdvice0).toHaveBeenCalled();
      expect(beforeAdviceX).toHaveBeenCalled();
      expect(aroundAdvice0).toHaveBeenCalled();
      expect(aroundAdviceX).toHaveBeenCalled();

      expect(beforeAdvice0).toHaveBeenCalledBefore(beforeAdviceX);
      expect(aroundAdvice0).toHaveBeenCalledBefore(aroundAdviceX);
    });
  });
});
