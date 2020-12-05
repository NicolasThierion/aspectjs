import { AnnotationFactory } from './annotation.factory';
import { setupTestingWeaverContext } from '@aspectjs/core/testing';

let factory: AnnotationFactory;

const FACTORY_GROUP_TEST_ID = 'testFactory';

const AClassStub = function AClass(x?: string, y?: number): ClassDecorator {
    return;
};

const APropertyStub = function AProperty(x?: string, y?: number): PropertyDecorator {
    return;
};

describe('AnnotationFactory', () => {
    let AClass: typeof AClassStub;
    let AProperty: typeof APropertyStub;

    beforeEach(() => {
        factory = new AnnotationFactory(FACTORY_GROUP_TEST_ID);
        setupTestingWeaverContext();
    });

    describe('.create(<AnnotationStub>)', () => {
        it('should return a decorator with the same name', () => {
            AClass = factory.create(AClassStub);

            expect(AClass.name).toEqual('AClass');
        });

        it(`should assign a the annotation's groupId to the factory's groupId`, () => {
            const _AClass = factory.create(AClassStub);

            expect(_AClass.groupId).toEqual(FACTORY_GROUP_TEST_ID);
        });
    });

    describe('.create(name, <AnnotationStub>)', () => {
        it('should return a decorator with the given name', () => {
            AClass = factory.create('AClass', (): ClassDecorator => undefined);

            expect(AClass.name).toEqual('AClass');
        });
    });

    describe('.create(<ClassAnnotationStub>)', () => {
        it('should return a class decorator', () => {
            AClass = factory.create(AClassStub);

            const annotation = AClass('0', 0);
            expect(annotation).toEqual(jasmine.any(Function));
            const ctor = (annotation as any)(class A {});
            expect(ctor).toEqual(jasmine.any(Function));
            expect(ctor.name).toEqual('A');
        });

        it('should keep the class instance type', () => {
            AClass = factory.create(AClassStub);

            @AClass('', 0)
            class A {
                someProp: any;
            }

            expect(new A()).toEqual(jasmine.any(A));
        });

        it(`should keep the class static properties`, () => {
            AClass = factory.create(AClassStub);

            class A {
                someProp: any;
                static someStaticProp = 'someStaticProp';
            }

            const enhancedA = (AClass('', 0)(A) as any) as typeof A;

            expect(A.someStaticProp).toBeTruthy();
            expect(enhancedA.someStaticProp).toEqual(A.someStaticProp);
        });
    });

    describe('.create(<PropertyAnnotationStub>)', () => {
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
