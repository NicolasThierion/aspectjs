import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { weaverContext } from '../../weaver/context/weaver.context.global';
import { Before } from './before.annotation';

import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import { AdviceError } from '../../public_api';
import type { BeforeContext } from './before.context';

describe('@Before(on.properties.withAnotations(<PROPERTY_ANNOTATION>) advice', () => {
  let advice: ReturnType<typeof jest.fn>;
  let aspect: any;
  const af = new AnnotationFactory('test');
  const AProperty = af.create(
    AnnotationType.PROPERTY,
    function AProperty(..._args: any[]) {},
  );
  const A2Property = af.create(
    AnnotationType.PROPERTY,
    function A2Property() {},
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);

    advice = jest.fn();

    @Aspect('APropertyAspect')
    class AAspect {
      @Before(on.properties.withAnnotations(AProperty))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.GET_PROPERTY>,
        ...args: unknown[]
      ): void {
        return advice.bind(this)(ctxt, ...args);
      }
    }

    aspect = new AAspect();
    weaver.enable(aspect);
  });

  it('has a "this"  bound to the aspect instance', () => {
    class A {
      @AProperty()
      prop = 'p';
    }

    expect(advice).not.toHaveBeenCalled();
    advice = jest.fn(function (this: any) {
      expect(this).toEqual(aspect);
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const p = new A().prop;
    expect(advice).toBeCalled();
    expect(p).toEqual('p');
  });

  it('calls the avice before the property is get', () => {
    const prop = jest.fn();
    class A {
      @AProperty()
      get prop() {
        prop();
        return 'x';
      }
    }

    expect(advice).not.toHaveBeenCalled();
    advice = jest.fn(function (this: any) {
      expect(this).toEqual(aspect);
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const p = new A().prop;
    expect(advice).toBeCalled();
    expect(advice).toHaveBeenCalledBefore(prop);
    expect(p).toEqual('x');
  });

  it('is not allowed to return', () => {
    class A {
      @AProperty()
      prop = 'p';
    }

    expect(advice).not.toHaveBeenCalled();
    advice = jest.fn(function (this: any) {
      return 'x';
    });

    expect(() => {
      new A().prop;
    }).toThrowError(AdviceError);

    try {
      new A().prop;
    } catch (e: any) {
      expect(
        e.message.indexOf('Returning from advice is not supported'),
      ).toBeGreaterThanOrEqual(0);
    }
  });

  describe('is called with a context ', () => {
    let thisInstance: any;

    it('with context.instance = the instance that owns the property', () => {
      class A {
        @AProperty()
        prop?: string;
      }
      advice = jest.fn((ctxt) => {
        thisInstance = ctxt.instance;
      });
      const a = new A();
      a.prop;
      expect(thisInstance).toEqual(a);
    });

    it('with context.annotation that contains the proper annotations context', () => {
      class A {
        constructor() {}
        @AProperty('annotationArg')
        @A2Property()
        prop?: string;
      }
      advice = jest.fn((ctxt: BeforeContext) => {
        expect(ctxt.annotations.length).toEqual(2);
        const aclassAnnotationContext = ctxt.annotations.filter(
          (an) => an.annotation === AProperty,
        )[0];
        expect(aclassAnnotationContext).toBeTruthy();
        expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
      });
      new A();
    });
  });
});
