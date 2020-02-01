import { AnnotationFactory } from '../factory/factory';
import { AnnotationLocation, AnnotationLocationFactory } from '../location/location';
import { AnnotationsBundle } from './bundle';
import { ClassAnnotation, MethodAnnotation, ParameterAnnotation, PropertyAnnotation } from '../annotation.types';

describe('given a class', () => {
    class X {
        someProp: any;

        someMethod(...args: any[]) {}
    }

    const factory = new AnnotationFactory('test');

    let AClassDecorator: ClassAnnotation;
    let BClassDecorator: ClassAnnotation;
    let AMethodDecorator: MethodAnnotation;
    let BMethodDecorator: MethodAnnotation;
    let APropertyDecorator: PropertyAnnotation;
    let BPropertyDecorator: PropertyAnnotation;
    let AParameterDecorator: ParameterAnnotation;
    let BParameterDecorator: ParameterAnnotation;

    beforeAll(() => {
        AClassDecorator = factory.create(function AClassDecorator(): ClassDecorator {
            return;
        });

        BClassDecorator = factory.create(function BClassDecorator(): ClassDecorator {
            return;
        });

        AMethodDecorator = factory.create(function AMethodDecorator(): MethodDecorator {
            return;
        });

        BMethodDecorator = factory.create(function BMethodDecorator(): MethodDecorator {
            return;
        });

        APropertyDecorator = factory.create(function APropertyDecorator(): PropertyDecorator {
            return;
        });

        BPropertyDecorator = factory.create(function BPropertyDecorator(): PropertyDecorator {
            return;
        });

        AParameterDecorator = factory.create(function AParameterDecorator(): ParameterDecorator {
            return;
        });

        BParameterDecorator = factory.create(function BParameterDecorator(): ParameterDecorator {
            return;
        });
    });

    let A: typeof X;
    describe('that do not use decorators', () => {
        describe('bundle.at()', () => {
            let x: X;
            let bundle: AnnotationsBundle<X>;
            beforeEach(() => {
                x = new X();
                A = X;
                bundle = AnnotationFactory.getBundle(X);
            });

            it('should return an empty array', () => {
                expect(Object.keys(bundle.at(AnnotationLocation.of(x)).all()).length).toEqual(0);
            });

            describe('given a method location', () => {
                it('should return an empty array', () => {
                    expect(Object.keys(bundle.at(AnnotationLocation.of(x).someMethod).all()).length).toEqual(0);
                });
            });
        });
    });

    describe('that uses any decorator', () => {
        beforeEach(() => {
            @AClassDecorator()
            class AClass extends X {
                @APropertyDecorator()
                property: any;

                @AMethodDecorator()
                someMethod(@AParameterDecorator() arg: any) {}
            }

            A = AClass;
        });

        describe('method "bundle.all()"', () => {
            it('should return all decorators', () => {
                const decorators = AnnotationFactory.getBundle(A).all();
                expect(decorators.length).toEqual(4);
                expect(decorators.map(c => c.name)).toContain(AClassDecorator.name);
                expect(decorators.map(c => c.name)).toContain(AMethodDecorator.name);
                expect(decorators.map(c => c.name)).toContain(AParameterDecorator.name);
                expect(decorators.map(c => c.name)).toContain(APropertyDecorator.name);
            });
        });
        describe('method "bundle.all(decoratorName)"', () => {
            describe('given a decorator that does not exists', () => {
                it('should return an empty array', () => {
                    expect(AnnotationFactory.getBundle(A).all(BClassDecorator)).toEqual([]);
                });
            });

            describe('given a class decorator that exists', () => {
                it('should return the requested decorator', () => {
                    const decorators = AnnotationFactory.getBundle(A).all(AClassDecorator);
                    expect(decorators.length).toEqual(1);
                    expect(decorators[0].name).toEqual(AClassDecorator.name);
                });
            });

            describe('given a method decorator that exists', () => {
                it('should return the requested decorator', () => {
                    const decorators = AnnotationFactory.getBundle(A).all(AMethodDecorator);
                    expect(decorators.length).toEqual(1);
                    expect(decorators[0].name).toEqual(AMethodDecorator.name);
                });
            });

            describe('given a property decorator that exists', () => {
                it('should return the requested decorator', () => {
                    const decorators = AnnotationFactory.getBundle(A).all(APropertyDecorator);
                    expect(decorators.length).toEqual(1);
                    expect(decorators[0].name).toEqual(APropertyDecorator.name);
                });
            });

            describe('given a argument decorator that exists', () => {
                it('should return the requested decorator', () => {
                    const decorators = AnnotationFactory.getBundle(A).all(AParameterDecorator);
                    expect(decorators.length).toEqual(1);
                    expect(decorators[0].name).toEqual(AParameterDecorator.name);
                });
            });
        });

        describe('method bundle.at()', () => {
            describe('given no argument', () => {
                it('should return an empty array', () => {
                    expect(
                        AnnotationFactory.getBundle(A)
                            .at(undefined)
                            .all(),
                    ).toEqual([]);
                });
            });
        });
    });

    let bundle: AnnotationsBundle<X>;

    describe('that uses class decorators', () => {
        beforeEach(() => {
            @BClassDecorator()
            @AClassDecorator()
            class AClass {
                someProp: any;

                someMethod(someParam: any) {}
            }

            A = AClass as any;
        });

        describe('method "bundle.at(class)"', () => {
            beforeEach(() => {
                bundle = AnnotationFactory.getBundle(A);
            });

            describe('.all()', () => {
                it('should return all class decorators', () => {
                    const decorators = bundle.at(AnnotationLocation.of(A)).all();
                    expect(decorators).toBeDefined();
                    expect(decorators).toEqual(jasmine.any(Array));
                    expect(decorators.length).toEqual(2);

                    expect(decorators[0].name).toEqual('AClassDecorator');
                    expect(decorators[1].name).toEqual('BClassDecorator');
                });
            });

            describe('.all()', () => {
                it('should get the class decorators with this name"', () => {
                    const decorators = bundle.at(AnnotationLocation.of(A)).all(AClassDecorator);
                    expect(decorators).toBeDefined();
                    expect(decorators).toEqual(jasmine.any(Array));
                    expect(decorators.length).toEqual(1);

                    expect(decorators[0].name).toEqual('AClassDecorator');
                });
            });
        });
    });

    describe('that uses method decorators', () => {
        beforeEach(() => {
            class AClass {
                someProp: any;

                @BMethodDecorator()
                @AMethodDecorator()
                someMethod(someParam: any) {}
            }

            A = AClass as any;
        });

        describe('method "bundle.at(method)"', () => {
            beforeEach(() => {
                bundle = AnnotationFactory.getBundle(A);
            });

            describe('.all()', () => {
                it('should get all the decorators for this method"', () => {
                    const decorators = bundle.at(AnnotationLocationFactory.of(A).someMethod).all();
                    expect(decorators).toBeDefined();
                    expect(decorators).toEqual(jasmine.any(Array));
                    expect(decorators.length).toEqual(2);

                    expect(decorators[0].name).toEqual('AMethodDecorator');
                    expect(decorators[1].name).toEqual('BMethodDecorator');
                });
            });

            describe('.all()', () => {
                it('should get the decorators with this name on this method"', () => {
                    const decorators = bundle.at(AnnotationLocationFactory.of(A).someMethod).all(AMethodDecorator);
                    expect(decorators).toBeDefined();
                    expect(decorators).toEqual(jasmine.any(Array));
                    expect(decorators.length).toEqual(1);

                    expect(decorators[0].name).toEqual('AMethodDecorator');
                });
            });
        });

        describe('that uses property decorators', () => {
            beforeEach(() => {
                class AClass {
                    @BPropertyDecorator()
                    @APropertyDecorator()
                    someProp: any;

                    someMethod(someParam: any) {}
                }

                A = AClass as any;
            });

            describe('method "bundle.at(property)"', () => {
                beforeEach(() => {
                    bundle = AnnotationFactory.getBundle(A);
                });

                describe('.all()', () => {
                    it('should get all the decorators for this property"', () => {
                        const decorators = bundle.at(AnnotationLocationFactory.of(A).someProp).all();
                        expect(decorators).toBeDefined();
                        expect(decorators).toEqual(jasmine.any(Array));
                        expect(decorators.length).toEqual(2);

                        expect(decorators[0].name).toEqual(APropertyDecorator.name);
                        expect(decorators[1].name).toEqual(BPropertyDecorator.name);
                    });
                });

                describe('.all()', () => {
                    it('should get the decorators with this name on this property"', () => {
                        const decorators = bundle.at(AnnotationLocationFactory.of(A).someProp).all(APropertyDecorator);
                        expect(decorators).toBeDefined();
                        expect(decorators).toEqual(jasmine.any(Array));
                        expect(decorators.length).toEqual(1);

                        expect(decorators[0].name).toEqual('APropertyDecorator');
                    });
                });
            });
        });

        describe('that uses parameter decorators', () => {
            beforeEach(() => {
                class AClass {
                    someProp: any;

                    someMethod(
                        @BParameterDecorator() @AParameterDecorator() someParam: any,
                        @BParameterDecorator() @AParameterDecorator() someParam2: any,
                    ) {}
                }

                A = AClass as any;
            });

            describe('method "bundle.at(parameter)"', () => {
                beforeEach(() => {
                    bundle = AnnotationFactory.getBundle(A);
                });

                describe('.all()', () => {
                    it('should get all the decorators for this method args"', () => {
                        let decorators = bundle.at(AnnotationLocationFactory.of(A).someMethod.args).all();
                        expect(decorators).toBeDefined();
                        expect(decorators).toEqual(jasmine.any(Array));
                        expect(decorators.length).toEqual(4);

                        expect(decorators[0].name).toEqual(AParameterDecorator.name);
                        expect(decorators[1].name).toEqual(BParameterDecorator.name);

                        decorators = bundle.at(AnnotationLocationFactory.of(A).someMethod.args[0]).all();
                        expect(decorators).toBeDefined();
                        expect(decorators).toEqual(jasmine.any(Array));
                        expect(decorators.length).toEqual(2);

                        expect(decorators[0].name).toEqual(AParameterDecorator.name);
                        expect(decorators[1].name).toEqual(BParameterDecorator.name);

                        decorators = bundle.at(AnnotationLocationFactory.of(A).someMethod.args[1]).all();
                        expect(decorators).toBeDefined();
                        expect(decorators).toEqual(jasmine.any(Array));
                        expect(decorators.length).toEqual(2);

                        expect(decorators[0].name).toEqual(AParameterDecorator.name);
                        expect(decorators[1].name).toEqual(BParameterDecorator.name);
                    });
                });

                describe('given the property location and the decorator', () => {
                    it('should get the decorators with this name on this property"', () => {
                        const decorators = bundle
                            .at(AnnotationLocationFactory.of(A).someMethod.args)
                            .all(AParameterDecorator);
                        expect(decorators).toBeDefined();
                        expect(decorators).toEqual(jasmine.any(Array));
                        expect(decorators.length).toEqual(2);

                        expect(decorators[0].name).toEqual(AParameterDecorator.name);
                        expect(decorators[0].target.parameterIndex).toEqual(0);
                        expect(decorators[1].name).toEqual(AParameterDecorator.name);
                        expect(decorators[1].target.parameterIndex).toEqual(1);
                    });
                });
            });
        });
    });
});
