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

describe('property get advice', () => {
  let advice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  const af = new AnnotationFactory('test');
  const AProperty = af.create(
    AnnotationType.PROPERTY,
    function AProperty(..._args: any[]) {},
  );
  const BProperty = af.create(AnnotationType.PROPERTY, function BProperty() {});
  let weaver: JitWeaver;

  beforeEach(() => {
    const context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);

    advice = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('APropertyAspect')
    class AAspect {
      @Before(on.properties.withAnnotations(...aanotations))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.GET_PROPERTY>,
        ...args: unknown[]
      ): void {
        return advice.bind(this)(ctxt, ...args);
      }
    }
    @Aspect('BPropertyAspect')
    class BAspect {
      @Before(on.properties.withAnnotations(...bannotations))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.GET_PROPERTY>,
        ...args: unknown[]
      ): void {
        return advice.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
  }

  describe('on pointcut @Before(on.properties.withAnnotations()', () => {
    beforeEach(() => setupAspects());

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        @AProperty()
        prop = 'p';
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const p = new A().prop;
      expect(advice).toBeCalledTimes(2);
      expect(p).toEqual('p');
    });
  });

  describe('on pointcut @Before(on.properties.withAnnotations(<PROPERTY_ANNOTATION>)', () => {
    beforeEach(() => {
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

      aaspect = new AAspect();
      weaver.enable(aaspect);
    });

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        @AProperty()
        prop = 'p';
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const p = new A().prop;
      expect(advice).toBeCalled();
      expect(p).toEqual('p');
    });

    it('calls the advice before the property is get', () => {
      const prop = jest.fn();
      class A {
        @AProperty()
        get prop() {
          prop();
          expect(this).toBe(a);
          return 'x';
        }
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
        expect(this).toBe(aaspect);
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const a = new A();
      const p = a.prop;
      expect(advice).toBeCalled();
      expect(advice).toHaveBeenCalledBefore(prop);
      expect(advice).toHaveBeenCalledTimes(1);
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

    it('can read/write the property without any issue', () => {
      class A {
        @AProperty()
        labels = ['a'];
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const a = new A();
      advice = jest.fn(function (this: any) {
        expect(this).toBe(aaspect);
        expect(a.labels).toEqual(['a']);
        a.labels = a.labels.concat('c');
        expect(a.labels).toEqual(['a', 'c']);
      });
      expect(advice).not.toHaveBeenCalled();
      a.labels = a.labels.concat('b');

      expect(advice).toBeCalled();
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it('has context.instance = the instance that owns the property', () => {
        class A {
          @AProperty()
          prop?: string;
        }
        advice = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        a.prop;
        expect(advice).toHaveBeenCalled();
        expect(thisInstance).toEqual(a);
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          constructor() {}
          @AProperty('annotationArg')
          @BProperty()
          prop?: string;
        }
        advice = jest.fn((ctxt: BeforeContext) => {
          expect(ctxt.annotations.length).toEqual(2);
          const aclassAnnotationContext = ctxt.annotations.filter(
            (an) => an.ref === AProperty.ref,
          )[0];

          expect(advice).toHaveBeenCalled();
          expect(aclassAnnotationContext).toBeTruthy();
          expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A();
      });
    });
  });
});
