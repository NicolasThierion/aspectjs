import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationKind } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { Before } from './before.annotation';

import type { PointcutKind } from '../../pointcut/pointcut-kind.type';
import { AdviceError } from '../../public_api';
import { WeaverModule } from '../../weaver/weaver.module';
import type { BeforeContext } from './before.context';
/* eslint-disable @typescript-eslint/no-unused-vars */

describe('property set advice', () => {
  let advice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  const af = new AnnotationFactory('test');
  const AProperty = af.create(
    AnnotationKind.PROPERTY,
    'AProperty',
    function (..._args: any[]) {},
  );
  const BProperty = af.create(
    AnnotationKind.PROPERTY,
    'BProperty',
    function () {},
  );
  let weaver: JitWeaver;

  beforeEach(() => {
    const context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);

    advice = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('APropertyAspect')
    class AAspect {
      @Before(on.properties.setter.withAnnotations(...aanotations))
      applyBefore(
        ctxt: BeforeContext<PointcutKind.SET_PROPERTY>,
        ...args: unknown[]
      ): void {
        return advice.bind(this)(ctxt, ...args);
      }
    }
    @Aspect('BPropertyAspect')
    class BAspect {
      @Before(on.properties.setter.withAnnotations(...bannotations))
      applyBefore(
        ctxt: BeforeContext<PointcutKind.SET_PROPERTY>,
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

  describe('on pointcut @Before(on.properties.setter.withAnnotations()', () => {
    beforeEach(() => setupAspects());

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        @AProperty()
        declare labels: string[];

        constructor() {
          this.labels = ['a'];
        }
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
        expect(this === aaspect || this === baspect).toBeTrue();
      });

      const a = new A();
      a.labels = a.labels.concat('b');
      expect(advice).toBeCalledTimes(4);
      expect(a.labels).toEqual(['a', 'b']);
    });
  });

  describe('on pointcut @Before(on.properties.setter.withAnnotations(<PROPERTY_ANNOTATION>)', () => {
    beforeEach(() => setupAspects([AProperty], [BProperty]));

    it('has a "this"  bound to the aspect instance', () => {
      class A {
        @AProperty()
        declare labels: string[];
        constructor() {
          this.labels = ['a'];
        }
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
        expect(this).toBe(aaspect);
      });

      const a = new A();
      expect(advice).toBeCalledTimes(1);
      expect(a.labels).toEqual(['a']);
    });

    it('calls the advice before the property is set', () => {
      class A {
        @AProperty()
        declare labels: string[];
        constructor() {
          this.labels = ['a'];
        }
      }

      expect(advice).not.toHaveBeenCalled();
      const a = new A();

      advice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
        expect(a.labels).toEqual(['a']);
      });

      a.labels = a.labels.concat('b');
      expect(advice).toBeCalled();
      expect(a.labels).toEqual(['a', 'b']);
    });

    it('is not allowed to return', () => {
      class A {
        @AProperty()
        declare prop?: string;
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
        return 'x';
      });

      expect(() => {
        new A().prop = 'b';
      }).toThrowError(AdviceError);

      try {
        new A().prop;
      } catch (e: any) {
        expect(
          e.message.indexOf('Returning from advice is not supported'),
        ).toBeGreaterThanOrEqual(0);
      }
    });

    it('can read the property without any issue', () => {
      class A {
        @AProperty()
        declare labels: string[];
        constructor() {
          this.labels = ['a'];
        }
      }

      const a = new A();
      advice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
        expect(a.labels).toEqual(['a']);
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
          declare labels: string[];
          constructor() {
            this.labels = ['a'];
          }
        }
        advice = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        expect(advice).toHaveBeenCalled();
        expect(thisInstance).toEqual(a);
      });
      it('has context.target.eval() = the value of the property', () => {
        class A {
          @AProperty()
          declare prop: string;

          constructor() {
            this.prop = 'a'; // 1st call
          }
        }
        let callNumber = 0;
        advice = jest.fn((ctxt: BeforeContext) => {
          if (++callNumber === 2) {
            expect(ctxt.target.eval()).toEqual('a');
          }
        });
        const a = new A();
        a.prop = 'b'; // 2nd call
        expect(advice).toHaveBeenCalledTimes(2);
      });

      it('has context.annotations that contains the proper annotation contexts', () => {
        class A {
          constructor() {}
          @AProperty('annotationArg')
          @BProperty()
          prop = 'a';
        }
        advice = jest.fn((ctxt: BeforeContext) => {
          expect(ctxt.annotations().find().length).toEqual(2);
          const aclassAnnotationContext = ctxt.annotations(AProperty).find()[0];
          expect(advice).toHaveBeenCalled();
          expect(aclassAnnotationContext).toBeTruthy();
          expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A();
      });
    });
  });
});
