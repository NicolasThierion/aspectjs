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

describe('static method advice', () => {
  let aadvice: ReturnType<typeof jest.fn>;
  let badvice: ReturnType<typeof jest.fn>;
  let aaspect: any;

  const AMethod = new AnnotationFactory('test').create(
    AnnotationKind.METHOD,
    'AMethod',
  );

  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);

    aadvice = jest.fn();
    badvice = jest.fn();
  });

  function setupAspects(aannotations: any[] = []) {
    @Aspect('AMethodLabel')
    class AAspect {
      @Before(on.methods.withAnnotations(...aannotations))
      applyBefore(
        ctxt: BeforeContext<PointcutKind.METHOD>,
        ...args: unknown[]
      ): void {
        return aadvice.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    weaver.enable(aaspect);
  }
  describe('on pointcut @Before(on.methods.withAnnotations()', () => {
    beforeEach(() => setupAspects());

    it('calls each matching advice once', () => {
      const staticMImpl = jest.fn();
      const mImpl = jest.fn();
      class A {
        @AMethod()
        static m(..._args: any[]) {
          staticMImpl(this, ..._args);
        }

        m() {
          mImpl();
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      expect(badvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {});

      A.m();
      // expect(aadvice).toHaveBeenCalledTimes(1);
      expect(mImpl).not.toHaveBeenCalled();
      new A().m();
      expect(mImpl).toHaveBeenCalled();
      expect(aadvice).toHaveBeenCalledTimes(1);
    });
  });
});
