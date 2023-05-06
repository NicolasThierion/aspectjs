import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { JitWeaver } from '../../jit/jit-weaver';
import { Aspect } from './../../aspect/aspect.annotation';
import { on } from './../../pointcut/pointcut-expression.factory';
import { weaverContext } from './../../weaver/context/weaver.context.global';
import { Before } from './before.annotation';

import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { BeforeContext } from './before.context';

describe('@Before(on.classes.withAnotations(<CLASS_ANOMATION>) advice', () => {
  let advice: ReturnType<typeof jest.fn>;
  let aspect: any;
  const AClass = new AnnotationFactory('test').create(
    AnnotationType.CLASS,
    'AClass',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);

    advice = jest.fn();

    @Aspect('AClassLabel')
    class AAspect {
      @Before(on.classes.withAnnotations(AClass))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.CLASS>,
        ...args: unknown[]
      ): void {
        advice.bind(this)(ctxt, ...args);
      }
    }

    aspect = new AAspect();
    weaver.enable(aspect);
  });

  it('has a "this"  bound to the aspect instance', () => {
    @AClass()
    class A {}

    expect(advice).not.toHaveBeenCalled();
    advice = jest.fn(function (this: any) {
      expect(this).toEqual(aspect);
    });

    new A();
    expect(advice).toBeCalled();
  });

  it('calls through the class constructor once', () => {
    @AClass()
    class A {
      constructor() {}
    }

    expect(advice).not.toHaveBeenCalled();
    advice = jest.fn(function (this: any) {});

    new A();
    expect(advice).toHaveBeenCalledTimes(1);
  });
  it('receives constructor arguments', () => {
    @AClass()
    class A {
      constructor(public labels = ['A']) {}
    }

    expect(advice).not.toHaveBeenCalled();
    advice = jest.fn(function (
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
    const ctor = jest.fn();
    @AClass()
    class A {
      constructor() {
        ctor();
      }
    }

    new A();
    expect(advice).toHaveBeenCalled();
    expect(ctor).toHaveBeenCalled();
    expect(advice).toHaveBeenCalledBefore(ctor);
  });

  describe('is called with a context ', () => {
    let thisInstance: any;

    it('with context.instance = null', () => {
      @AClass()
      class A {
        constructor() {}
      }
      advice = jest.fn((ctxt) => {
        thisInstance = ctxt.instance;
      });
      new A();

      expect(thisInstance).toBeNull();
    });
  });
});
