import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import { Before } from '../advices/before/before.annotation';
import { Aspect } from '../aspect/aspect.annotation';
import { JitWeaver } from '../jit/jit-weaver';
import { on } from '../pointcut/pointcut-expression.factory';
import { weaverContext } from '../weaver/context/weaver.context.global';
import { Weaver } from './../weaver/weaver';
import { Order } from './order.annotation';

const Annotation0 = new AnnotationFactory('test').create('Annotation0');
const AnnotationX = new AnnotationFactory('test').create('AnnotationX');

describe('@Order(<PRECEDENCE>) annotation', () => {
  let advice0 = jest.fn();
  let adviceX = jest.fn();
  let aspect0: any, aspectX: any;
  let weaver: Weaver;
  beforeEach(() => {
    const context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);
    advice0 = jest.fn();
    adviceX = jest.fn();

    @Aspect()
    @Order(0)
    class Aspect0 {
      @Before(on.methods.withAnnotations(Annotation0))
      applyBefore0() {
        advice0();
      }
    }

    @Aspect()
    class AspectX {
      @Before(on.methods.withAnnotations(AnnotationX))
      applyBeforeX() {
        adviceX();
      }
    }

    aspect0 = new Aspect0();
    aspectX = new AspectX();
  });

  describe('on an aspect class', () => {
    it('should call advices with higher precedence that aspects not annotated with the @Order annotation', () => {
      weaver.enable(aspectX, aspect0);

      class A {
        @Annotation0()
        @AnnotationX()
        m() {}
      }

      expect(advice0).not.toHaveBeenCalled();
      expect(adviceX).not.toHaveBeenCalled();
      new A().m();

      expect(advice0).toHaveBeenCalled();
      expect(adviceX).toHaveBeenCalled();

      expect(advice0).toHaveBeenCalledBefore(adviceX);
    });
  });
});
