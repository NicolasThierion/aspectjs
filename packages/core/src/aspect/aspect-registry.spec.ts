import { AnnotationFactory, TestingReflectContext } from '@aspectjs/common';
import { configureReflectTestingContext } from '@aspectjs/common/testing';
import type { ConstructorType } from 'packages/common/src/constructor.type';
import { Aspect } from './aspect.annotation';
import { AspectModule } from './aspect.module';
import type { AspectRegistry } from './aspect.registry';
import type { AspectType } from './aspect.type';

describe('AspectModule', () => {
  let context!: TestingReflectContext;
  beforeEach(() => {
    context?.reset();
    context = configureReflectTestingContext(new AspectModule());
  });
  it('adds a new AspectRegistry provider to the ReflectContext', () => {
    expect(context.has('aspectRegistry'));
  });
});

describe('AspectRegistry', () => {
  let context!: TestingReflectContext;
  let aspectRegistry!: AspectRegistry;
  let testAspect!: ConstructorType<AspectType>;

  beforeEach(() => {
    context?.reset();
    context = configureReflectTestingContext(new AspectModule());
    aspectRegistry = context.get('aspectRegistry');
  });

  describe('.find(aspectId: string)', () => {
    describe('when @Aspect(aspectId) exists', () => {
      beforeEach(() => {
        @Aspect('testAspect')
        class TestAspect {}
        testAspect = TestAspect;
      });
      it('returns the aspect and its options', () => {
        const entry = aspectRegistry.find('testAspect');

        expect(entry?.aspect).toEqual(testAspect);
        expect(entry?.options).toEqual({
          id: 'testAspect',
        });
      });
    });

    describe('when @Aspect(aspectId) does not exist', () => {
      beforeEach(() => {
        @Aspect()
        class TestAspect {}
        testAspect = TestAspect;
      });
      it('returns undefined', () => {
        const entry = aspectRegistry.find('do-not-exists');

        expect(entry).toBeUndefined();
      });
    });
  });

  describe('.find(aspect: class)', () => {
    describe('when given class is annotated with  @Aspect(options: object)', () => {
      beforeEach(() => {
        @Aspect({
          id: 'testAspect',
        })
        class TestAspect {}
        testAspect = TestAspect;
      });
      it('returns the aspect and its options', () => {
        const entry = aspectRegistry.find(testAspect);

        expect(entry?.aspect).toEqual(testAspect);
        expect(entry?.options).toEqual({
          id: 'testAspect',
        });
      });
    });

    describe('when given class is annotated with  @Aspect(<empty>)', () => {
      beforeEach(() => {
        @Aspect()
        class TestAspect {}
        testAspect = TestAspect;
      });
      it('returns the aspect', () => {
        const entry = aspectRegistry.find(testAspect);

        expect(entry?.aspect).toEqual(testAspect);
      });
    });

    describe('when given class is not annotated with @Aspect()', () => {
      beforeEach(() => {
        const Test = new AnnotationFactory('test').create(function Test() {});
        @Test()
        class TestAspect {}
        testAspect = TestAspect;
      });
      it('returns undefined', () => {
        const entry = aspectRegistry.find(testAspect);

        expect(entry).toBeUndefined();
      });
    });
  });
});
