/* eslint-disable @typescript-eslint/no-empty-function */
import { configureTesting } from '@aspectjs/common/testing';
import type { Annotation, AnnotationKind } from './annotation.types';
import { AnnotationFactory } from './factory/annotation.factory';

let factory: AnnotationFactory;
const FACTORY_GROUP_TEST_ID = 'testFactory';

describe(`Property Annotations`, () => {
  const APropertyStub = jest.fn(function AProperty(
    _x?: string,
    _y?: number,
  ) {});
  let AProperty: Annotation<AnnotationKind.PROPERTY, typeof APropertyStub>;

  beforeEach(() => {
    configureTesting();
    factory = new AnnotationFactory(FACTORY_GROUP_TEST_ID);
    AProperty = factory.create(APropertyStub);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a property decorator', () => {
    const decorator = AProperty('0', 0);
    expect(typeof decorator).toBe('function');
    class A {
      @AProperty('0', 0)
      property = 'property';
    }
    const res = decorator(A, 'property');
    expect(typeof res).toBe('undefined');
  });

  describe('applied on a property', () => {
    let A = class A {
      someProp = 'someProp';
      static someStaticProp = 'someStaticProp';
    };
    beforeEach(() => {
      class AImpl {
        @AProperty('0', 0)
        someProp = 'someProp';
        static someStaticProp = 'someStaticProp';
      }
      A = AImpl;
    });
    it('keeps the class instance type', () => {
      const a = new A();
      expect(a).toBeInstanceOf(A);
    });
    it('calls through the annotation stub', () => {
      expect(APropertyStub).toBeCalledTimes(1);
    });
    it(`keeps the class attributes`, () => {
      expect(new A().someProp).toEqual('someProp');
    });
    it(`keeps the static class attributes`, () => {
      expect(A.someStaticProp).toEqual('someStaticProp');
    });
  });
});
