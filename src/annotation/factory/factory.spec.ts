import { AnnotationFactory } from './factory';
import { setWeaver } from '../../index';
import { LoadTimeWeaver } from '../../weaver/load-time/load-time-weaver';

let factory: AnnotationFactory;

const FACTORY_GROUP_TEST_ID = 'testFactory';
const WEAVER_TEST_NAME = 'testWeaver';

const AClassStub = function AClass(x?: string, y?: number): ClassDecorator {
    return;
};

const APropertyStub = function AProperty(x?: string, y?: number): PropertyDecorator {
    return;
};

describe('Annotation Factory', () => {
    let AClass: typeof AClassStub;
    let AProperty: typeof APropertyStub;

    beforeEach(() => {
        factory = new AnnotationFactory(FACTORY_GROUP_TEST_ID);
        setWeaver(new LoadTimeWeaver(WEAVER_TEST_NAME));
    });

    describe('method "create"', () => {
        describe('given any annotation', () => {
            it('should return a decorator with the same name', () => {
                AClass = factory.create(AClassStub);

                expect(AClass.name).toEqual('AClass');
                expect(AClass('0', 0).name).toEqual('AClass');
            });

            it(`should assign a the annotation's groupId to the factory's groupId`, () => {
                const _AClass = factory.create(AClassStub);

                expect(_AClass.groupId).toEqual(FACTORY_GROUP_TEST_ID);
            });
        });
        describe('given a class annotation', () => {
            it('should return a class decorator', () => {
                AClass = factory.create(AClassStub);

                const annotation = AClass('0', 0);
                expect(annotation).toEqual(jasmine.any(Function));
                const ctor = (annotation as any)(class A {});
                expect(ctor).toEqual(jasmine.any(Function));
                expect(ctor.name).toEqual('A');
            });

            it('should not alter the class', () => {
                AClass = factory.create(AClassStub);

                @AClass('', 0)
                class A {
                    someProp: any;
                }

                expect(new A()).toEqual(jasmine.any(A));
            });
        });

        describe('given a property annotation', () => {
            it('should return a property decorator', () => {
                AProperty = factory.create(APropertyStub);

                const annotation = AProperty('0', 0);
                expect(annotation).toEqual(jasmine.any(Function));
                const descriptor = (annotation as any)(new (class A {})(), 'propName');
                expect(descriptor).toEqual(jasmine.any(Object));
                expect(descriptor.enumerable).toEqual(true);
                expect(descriptor.configurable).toEqual(true);
            });

            it('should not alter the property', () => {
                AProperty = factory.create(APropertyStub);

                class A {
                    @AProperty()
                    someProp: any;
                }

                const a = new A();
                expect(a.someProp).toEqual(undefined);
                a.someProp = 'somePropValue';
                expect(a.someProp).toEqual('somePropValue');
            });
        });
    });
});
