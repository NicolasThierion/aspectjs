import { AnnotationFactory } from '../factory/factory';
import { AnnotationsBundle } from './bundle';
import { ClassAnnotation, MethodAnnotation, ParameterAnnotation, PropertyAnnotation } from '../annotation.types';
import { AnnotationLocationFactory } from '../target/annotation-target.factory';
import { setWeaver } from '../../weaver/weaver';
import { LoadTimeWeaver } from '../../weaver/load-time/load-time-weaver';

describe('given a class', () => {
    beforeEach(() => setWeaver(new LoadTimeWeaver()));
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
    describe('that do not use annotations', () => {
        describe('bundle.at()', () => {
            let x: X;
            let bundle: AnnotationsBundle<X>;
            beforeEach(() => {
                x = new X();
                A = X;
                bundle = AnnotationFactory.getBundle(X);
            });

            it('should return an empty array', () => {
                expect(Object.keys(bundle.at(AnnotationLocationFactory.of(x)).all()).length).toEqual(0);
            });

            describe('given a method location', () => {
                it('should return an empty array', () => {
                    expect(Object.keys(bundle.at(AnnotationLocationFactory.of(x).someMethod).all()).length).toEqual(0);
                });
            });
        });
    });

    describe('that uses any annotation', () => {
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
            it('should return all annotations', () => {
                const annotations = AnnotationFactory.getBundle(A).all();
                expect(annotations.length).toEqual(4);
                expect(annotations.map(c => c.name)).toContain(AClassDecorator.name);
                expect(annotations.map(c => c.name)).toContain(AMethodDecorator.name);
                expect(annotations.map(c => c.name)).toContain(AParameterDecorator.name);
                expect(annotations.map(c => c.name)).toContain(APropertyDecorator.name);
            });
        });
        describe('method "bundle.all(annotationName)"', () => {
            describe('given a annotation that does not exists', () => {
                it('should return an empty array', () => {
                    expect(AnnotationFactory.getBundle(A).all(BClassDecorator)).toEqual([]);
                });
            });

            describe('given a class annotation that exists', () => {
                it('should return the requested annotation', () => {
                    const annotations = AnnotationFactory.getBundle(A).all(AClassDecorator);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AClassDecorator.name);
                });
            });

            describe('given a method annotation that exists', () => {
                it('should return the requested annotation', () => {
                    const annotations = AnnotationFactory.getBundle(A).all(AMethodDecorator);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AMethodDecorator.name);
                });
            });

            describe('given a property annotation that exists', () => {
                it('should return the requested annotation', () => {
                    const annotations = AnnotationFactory.getBundle(A).all(APropertyDecorator);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(APropertyDecorator.name);
                });
            });

            describe('given a argument annotation that exists', () => {
                it('should return the requested annotation', () => {
                    const annotations = AnnotationFactory.getBundle(A).all(AParameterDecorator);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AParameterDecorator.name);
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

    describe('that uses class annotations', () => {
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
                it('should return all class annotations', () => {
                    const annotations = bundle.at(AnnotationLocationFactory.of(A)).all();
                    expect(annotations).toBeDefined();
                    expect(annotations).toEqual(jasmine.any(Array));
                    expect(annotations.length).toEqual(2);

                    expect(annotations[0].name).toEqual('AClassDecorator');
                    expect(annotations[1].name).toEqual('BClassDecorator');
                });
            });

            describe('.all()', () => {
                it('should get the class annotations with this name"', () => {
                    const annotations = bundle.at(AnnotationLocationFactory.of(A)).all(AClassDecorator);
                    expect(annotations).toBeDefined();
                    expect(annotations).toEqual(jasmine.any(Array));
                    expect(annotations.length).toEqual(1);

                    expect(annotations[0].name).toEqual('AClassDecorator');
                });
            });
        });
    });

    describe('that uses method annotations', () => {
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
                it('should get all the annotations for this method"', () => {
                    const annotations = bundle.at(AnnotationLocationFactory.of(A).someMethod).all();
                    expect(annotations).toBeDefined();
                    expect(annotations).toEqual(jasmine.any(Array));
                    expect(annotations.length).toEqual(2);

                    expect(annotations[0].name).toEqual('AMethodDecorator');
                    expect(annotations[1].name).toEqual('BMethodDecorator');
                });
            });

            describe('.all()', () => {
                it('should get the annotations with this name on this method"', () => {
                    const annotations = bundle.at(AnnotationLocationFactory.of(A).someMethod).all(AMethodDecorator);
                    expect(annotations).toBeDefined();
                    expect(annotations).toEqual(jasmine.any(Array));
                    expect(annotations.length).toEqual(1);

                    expect(annotations[0].name).toEqual('AMethodDecorator');
                });
            });
        });

        describe('that uses property annotations', () => {
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
                    it('should get all the annotations for this property"', () => {
                        const annotations = bundle.at(AnnotationLocationFactory.of(A).someProp).all();
                        expect(annotations).toBeDefined();
                        expect(annotations).toEqual(jasmine.any(Array));
                        expect(annotations.length).toEqual(2);

                        expect(annotations[0].name).toEqual(APropertyDecorator.name);
                        expect(annotations[1].name).toEqual(BPropertyDecorator.name);
                    });
                });

                describe('.all()', () => {
                    it('should get the annotations with this name on this property"', () => {
                        const annotations = bundle.at(AnnotationLocationFactory.of(A).someProp).all(APropertyDecorator);
                        expect(annotations).toBeDefined();
                        expect(annotations).toEqual(jasmine.any(Array));
                        expect(annotations.length).toEqual(1);

                        expect(annotations[0].name).toEqual('APropertyDecorator');
                    });
                });
            });
        });

        describe('that uses parameter annotations', () => {
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
                    it('should get all the annotations for this method args"', () => {
                        let annotations = bundle.at(AnnotationLocationFactory.of(A).someMethod.args).all();
                        expect(annotations).toBeDefined();
                        expect(annotations).toEqual(jasmine.any(Array));
                        expect(annotations.length).toEqual(4);

                        expect(annotations[0].name).toEqual(AParameterDecorator.name);
                        expect(annotations[1].name).toEqual(BParameterDecorator.name);

                        annotations = bundle.at(AnnotationLocationFactory.of(A).someMethod.args[0]).all();
                        expect(annotations).toBeDefined();
                        expect(annotations).toEqual(jasmine.any(Array));
                        expect(annotations.length).toEqual(2);

                        expect(annotations[0].name).toEqual(AParameterDecorator.name);
                        expect(annotations[1].name).toEqual(BParameterDecorator.name);

                        annotations = bundle.at(AnnotationLocationFactory.of(A).someMethod.args[1]).all();
                        expect(annotations).toBeDefined();
                        expect(annotations).toEqual(jasmine.any(Array));
                        expect(annotations.length).toEqual(2);

                        expect(annotations[0].name).toEqual(AParameterDecorator.name);
                        expect(annotations[1].name).toEqual(BParameterDecorator.name);
                    });
                });

                describe('given the property location and the annotation', () => {
                    it('should get the annotations with this name on this property"', () => {
                        const annotations = bundle
                            .at(AnnotationLocationFactory.of(A).someMethod.args)
                            .all(AParameterDecorator);
                        expect(annotations).toBeDefined();
                        expect(annotations).toEqual(jasmine.any(Array));
                        expect(annotations.length).toEqual(2);

                        expect(annotations[0].name).toEqual(AParameterDecorator.name);
                        expect(annotations[0].target.parameterIndex).toEqual(0);
                        expect(annotations[1].name).toEqual(AParameterDecorator.name);
                        expect(annotations[1].target.parameterIndex).toEqual(1);
                    });
                });
            });
        });
    });
});
