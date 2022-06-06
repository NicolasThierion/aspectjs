/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import type { Annotation, AnnotationType } from '../annotation.types';
import { AnnotationFactory } from './annotation.factory';

let factory: AnnotationFactory;
const FACTORY_GROUP_TEST_ID = 'testFactory';

describe('AnnotationFactory(groupId)', () => {
  const AClassStub = jest.fn(function AClass(_x?: string, _y?: number) {});
  let AClass: Annotation<AnnotationType.CLASS, typeof AClassStub>;

  beforeEach(() => {
    factory = new AnnotationFactory(FACTORY_GROUP_TEST_ID);
  });

  describe('.create(<AnnotationStub>)', () => {
    it('returns a function', () => {
      AClass = factory.create(AClassStub);
      expect(typeof AClass).toBe('function');
    });

    it('returns an annotation', () => {
      AClass = factory.create(AClassStub);
      expect(AClass.groupId).toBeDefined();
      expect(AClass.name).toBeDefined();
      expect(AClass.ref).toBeDefined();

      const ref = AClass.ref;
      expect(ref.groupId).toBeDefined();
      expect(ref.name).toBeDefined();
      expect(ref.value).toBeDefined();
    });

    describe(':Annotation', () => {
      beforeEach(() => {
        AClass = factory.create(AClassStub);
      });
      describe('.name', () => {
        it('matchs stub name', () => {
          expect(AClass.name).toEqual(AClassStub.name);
        });
      });
      describe('.groupId', () => {
        it(`should match AnnotationFactory's groupId`, () => {
          expect(AClass.groupId).toEqual(factory.groupId);
        });
      });
      describe('.ref.value', () => {
        it(`should match name:groupId`, () => {
          expect(AClass.ref.value).toEqual(`${AClass.groupId}:${AClass.name}`);
        });
      });
    });
  });
});

// TODO
// describe('.create(<PropertyAnnotationStub>)', () => {
//   let labeled: Labeled;
//   let stubSpy: jest.SpiedFunction;

//   beforeEach(() => {
//     stubSpy = jest.fn(APropertyStub);
//     AProperty = factory.create(stubSpy);

//     class A implements Labeled {
//       @AProperty()
//       label: any;
//     }

//     labeled = new A();
//   });
//   it('nots alter the property', () => {
//     expect(labeled.label).toEqual(undefined);
//     labeled.label = 'somePropValue';
//     expect(labeled.label).toEqual('somePropValue');
//   });

//   it('calls the original annotation stub', () => {
//     labeled.label = 'somePropValue';
//     expect(stubSpy).toHaveBeenCalled();
//   });
// });
