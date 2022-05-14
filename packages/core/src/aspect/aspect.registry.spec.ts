import { AnnotationFactory } from '@aspectjs/common';
import { configureAspectTestingContext } from '@aspectjs/core/testing';
import type { ConstructorType } from 'packages/common/src/constructor.type';
import { Aspect } from './aspect.annotation';
import type { AspectRegistry } from './aspect.registry';
import type { AspectType } from './aspect.type';

describe('AspectRegistry', () => {
  let aspectRegistry!: AspectRegistry;
  beforeEach(() => {
    const context = configureAspectTestingContext();
    aspectRegistry = context.get('aspectRegistry');
  });
  describe('.isAspect(<arg>)', () => {
    describe('given a class', () => {
      describe('annotated with @Aspect()', () => {
        it('returns true', () => {
          @Aspect()
          class TestAspect {}
          expect(aspectRegistry.isAspect(TestAspect)).toBe(true);
        });
      });

      describe('not annotated with @Aspect()', () => {
        it('returns false', () => {
          const Test = new AnnotationFactory('test').create(function Test() {});
          @Test()
          class TestDummy {}

          expect(aspectRegistry.isAspect(TestDummy)).toBe(false);
        });
      });
    });

    describe('given anything not a class', () => {
      it('returns false', () => {
        expect(aspectRegistry.isAspect({} as any)).toBe(false);
      });
    });
  });

  describe('.getAspectOptions(<args>)', () => {
    let TestAspect: ConstructorType<AspectType>;
    describe('given a class annotated with @Aspect(aspectId)', () => {
      beforeEach(() => {
        @Aspect('testAspect')
        class _TestAspect {}
        TestAspect = _TestAspect;
      });
      it('returns the aspect and its options', () => {
        const options = aspectRegistry.getAspectOptions(TestAspect);

        expect(options).toEqual({
          id: 'testAspect',
        });
      });
    });

    describe('when given class is not annotated with @Aspect()', () => {
      beforeEach(() => {
        const Test = new AnnotationFactory('test').create(function Test() {});
        @Test()
        class _TestAspect {}
        TestAspect = _TestAspect;
      });
      it('throws an error', () => {
        expect(() => {
          aspectRegistry.getAspectOptions(TestAspect);
        }).toThrow(TypeError);
      });
    });
  });
});
