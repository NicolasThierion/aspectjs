import { AnnotationFactory } from './factory';
import { getWeaver, setWeaver } from '../../../index';
import { Weaver } from '../../load-time/load-time-weaver';

let factory: AnnotationFactory;

const FACTORY_GROUP_TEST_ID = 'testFactory';
const WEAVER_TEST_NAME = 'testWeaver';
describe('Annotation Factory', () => {
    let AClass = function AClass(x?: string, y?: number): ClassDecorator {
        return;
    };

    beforeEach(() => {
        factory = new AnnotationFactory(FACTORY_GROUP_TEST_ID);
        setWeaver(new Weaver(WEAVER_TEST_NAME));
    });

    describe('method "create"', () => {
        describe('after weaver did load', () => {
            beforeEach(() => {
                getWeaver().load();
            });
            describe('given a class annotation', () => {
                describe('that has no name', () => {
                    it('should throw an error', () => {
                        expect(() => {
                            AClass = factory.create(function(): ClassDecorator {
                                return;
                            });
                        }).toThrow(new TypeError('Annotation functions should have a name'));
                    });
                });

                it('should return a class decorator', () => {
                    AClass = factory.create(AClass);

                    expect(AClass('0', 0)).toEqual(jasmine.any(Function));
                    @AClass('', 0)
                    class A {
                        someProp: any;
                    }

                    expect(new A()).toEqual(jasmine.any(A));
                });

                it('should return a class decorator with the same name', () => {
                    AClass = factory.create(AClass);

                    expect(AClass.name).toEqual('AClass');
                    expect(AClass('0', 0).name).toEqual('AClass');
                });

                it(`should assign a the annotation's groupId to the factory's groupId`, () => {
                    const _AClass = factory.create(AClass);

                    expect(_AClass.groupId).toEqual(FACTORY_GROUP_TEST_ID);
                });
            });
        });
    });
});
