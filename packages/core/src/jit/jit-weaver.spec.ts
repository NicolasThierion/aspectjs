import {
  AnnotationFactory,
  AnnotationTargetFactory,
  AnnotationType,
} from '@aspectjs/common';
import {
  ReflectTestingContext,
  configureTesting,
} from '@aspectjs/common/testing';

import { Before } from '../advices/before/before.annotation';
import { Aspect } from '../aspect/aspect.annotation';
import { WeavingError } from '../errors/weaving.error';
import { on } from '../pointcut/pointcut-expression.factory';
import { weaverContext } from '../weaver/context/weaver.context.global';
import { JitWeaver } from './jit-weaver';

describe('JitWeaver', () => {
  let context!: ReflectTestingContext;
  let weaver!: JitWeaver;
  beforeEach(() => {
    context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);
  });
  afterEach(() => {
    context.reset();
  });

  describe('.getAspects()', () => {
    it('returns the aspects that have been enabled', () => {
      @Aspect()
      class Aspect1 {}

      @Aspect()
      class Aspect2 {}

      const [a1, a2] = [new Aspect1(), new Aspect2()];
      weaver.enable(a1, a2);
      expect(weaver.getAspects()).toEqual([a1, a2]);
    });
  });

  describe('.enable(<CLASS>)', () => {
    describe('after any annotation has been applied already', () => {
      it('throws an error', () => {
        const AClass = new AnnotationFactory('tests').create(
          AnnotationType.CLASS,
          'AClass',
        );
        @AClass()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class A {}

        @Aspect()
        class LateAspectA {
          @Before(on.classes.withAnnotations(AClass))
          shouldThrow() {}
        }

        expect(() => {
          weaver.enable(new LateAspectA());
        }).toThrow(
          new WeavingError(
            'Could not enable aspect LateAspectA: Annotations have already been processed: @tests:AClass',
          ),
        );
      });
    });

    describe('given a class that is not annotated with @Aspect', () => {
      it('throws an error', () => {
        expect(() => {
          weaver.enable({});
        }).toThrow(new WeavingError('class Object is not an aspect'));
      });

      describe('but parent class is', () => {
        it('does not throw an error', () => {
          @Aspect()
          class AspectA {}

          class ChildAspectA extends AspectA {}

          expect(() => {
            weaver.enable(new ChildAspectA());
          }).not.toThrow();
        });
      });
    });
  });

  describe('.enhance(<ClassAnnotationTarget>)', () => {
    let enhanced!: any;
    let enhancable!: any;
    let spy: () => void;
    beforeEach(() => {
      spy = jest.fn();
      class TestClass {
        constructor() {
          spy();
        }
      }
      enhancable = TestClass;
      const atf = context.get(AnnotationTargetFactory);
      const target = atf.of(enhancable);

      enhanced = weaver.enhance(target);
    });

    it('returns a class of the same type', () => {
      expect(new enhanced()).toBeInstanceOf(enhancable);
      expect(spy).toHaveBeenCalled();
    });
  });
});
