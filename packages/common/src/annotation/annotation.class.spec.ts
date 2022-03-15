/* eslint-disable @typescript-eslint/no-empty-function */
import type { Annotation, AnnotationType } from './annotation.types';
import { AnnotationFactory } from './factory/annotation.factory';

let factory: AnnotationFactory;
const FACTORY_GROUP_TEST_ID = 'testFactory';

describe(`Class Annotations`, () => {
  const AClassStub = jest.fn(function AClass(_x?: string, _y?: number) {});
  let AClass: Annotation<AnnotationType.CLASS, typeof AClassStub>;

  beforeEach(() => {
    factory = new AnnotationFactory(FACTORY_GROUP_TEST_ID);
    AClass = factory.create(AClassStub);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a class decorator', () => {
    const decorator = AClass('0', 0);
    expect(typeof decorator).toBe('function');
    const A = class A {};
    const ctor = decorator(A);
    expect(typeof ctor).toBe('function');
    expect(ctor).toBe(A);
    expect(ctor.name).toEqual('A');
  });

  describe('applied on a class', () => {
    let A = class A {
      someProp = 'someProp';
      static someStaticProp = 'someStaticProp';
    };

    beforeEach(() => {
      @AClass('0', 0)
      class AImpl {
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
      expect(AClassStub).toBeCalledTimes(1);
    });
    it(`should keep the class attributes`, () => {
      expect(new A().someProp).toEqual('someProp');
    });
    it(`should keep the static class attributes`, () => {
      expect(A.someStaticProp).toEqual('someStaticProp');
    });
  });
});
