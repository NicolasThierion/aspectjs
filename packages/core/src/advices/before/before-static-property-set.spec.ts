import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationKind } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { Before } from './before.annotation';

import type { PointcutKind } from '../../pointcut/pointcut-kind.type';
import { WeaverModule } from '../../weaver/weaver.module';
import type { BeforeContext } from './before.context';
/* eslint-disable @typescript-eslint/no-unused-vars */

describe('static property set advice', () => {
  let aadvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  const af = new AnnotationFactory('test');
  const AProperty = af.create(
    AnnotationKind.PROPERTY,
    'AProperty',
    function (..._args: any[]) {},
  );
  let weaver: JitWeaver;

  beforeEach(() => {
    const context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);

    aadvice = jest.fn();
  });

  describe('on pointcut @Before(on.properties.setter.withAnnotations(<PROPERTY_ANNOTATION>)', () => {
    beforeEach(() => {
      @Aspect('APropertyAspect')
      class AAspect {
        @Before(on.properties.setter.withAnnotations(AProperty))
        applyBefore(
          ctxt: BeforeContext<PointcutKind.GET_PROPERTY>,
          ...args: unknown[]
        ): void {
          return aadvice.bind(this)(ctxt, ...args);
        }
      }

      aaspect = new AAspect();
      weaver.enable(aaspect);
    });

    it('calls the advice before the property is set', () => {
      class A {
        @AProperty()
        static prop = 'a';

        prop = 'b';
      }

      aadvice = jest.fn(function (this: any, _ctxt: BeforeContext) {
        expect(this).toBe(aaspect);
      });

      expect(A.prop).toEqual('a');
      A.prop = 'A';
      expect(A.prop).toEqual('A');
      expect(new A().prop).toEqual('b');
      expect(aadvice).toHaveBeenCalledTimes(1);
    });
  });
});
