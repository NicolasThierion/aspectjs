import {
    AClass,
    AMethod,
    AParameter,
    AProperty,
    BClass,
    BMethod,
    BParameter,
    BProperty,
    CClass,
    CMethod,
    CParameter,
    CProperty,
    DClass,
    DMethod,
    DParameter,
    DProperty,
    setupTestingWeaverContext,
    XClass,
    XMethod,
    XParameter,
    XProperty,
} from '@aspectjs/core/testing';
import { RootAnnotationsBundle, WeaverContext } from '@aspectjs/core/commons';

describe('RootAnnotationsBundle', () => {
    let rootBundle: RootAnnotationsBundle;
    let weaverContext: WeaverContext;
    beforeEach(() => {
        weaverContext = setupTestingWeaverContext();
        rootBundle = weaverContext.annotations.bundle;
    });

    class Empty {
        somePropAB: string;

        someMethodAB(...args: any[]) {}
    }

    const empty = new Empty();
    let abcd: Empty;
    let x: Empty;
    beforeEach(() => {
        @AClass()
        @BClass()
        @CClass()
        @DClass()
        class _ABCD extends Empty {
            @AProperty()
            @BProperty()
            somePropAB: any;

            @CProperty()
            @DProperty()
            somePropCD: any;

            @AMethod()
            @BMethod()
            someMethodAB(@AParameter() @BParameter() arg1: any, @AParameter() @BParameter() arg2: any) {}

            @CMethod()
            @DMethod()
            someMethodCB(@CParameter() @DParameter() arg1: any, @CParameter() @DParameter() arg2: any) {}
        }

        abcd = new _ABCD();

        @XClass()
        class X extends _ABCD {
            @XProperty()
            somePropAB: any;

            @XMethod()
            someMethodAB(@XParameter() arg1: any) {}
        }

        x = new X();
    });

    describe('all()', () => {
        it('should give all annotations across all symbols', () => {
            const annotationsName = rootBundle.all().map((a) => a.name);
            expect(annotationsName).toContain(AClass.name);
            expect(annotationsName).toContain(XClass.name);
            expect(annotationsName).toContain(AParameter.name);
            expect(annotationsName).toContain(XParameter.name);
            expect(annotationsName).toContain(AProperty.name);
            expect(annotationsName).toContain(XProperty.name);
            expect(annotationsName).toContain(AMethod.name);
            expect(annotationsName).toContain(XMethod.name);
        });
    });
    describe('all(Annotation)', () => {
        it('should give all annotations across all symbols', () => {
            const annotationsName = rootBundle.all(AClass, XParameter).map((a) => a.name);
            expect(annotationsName).toContain(AClass.name);
            expect(annotationsName).not.toContain(XClass.name);
            expect(annotationsName).not.toContain(AParameter.name);
            expect(annotationsName).toContain(XParameter.name);
            expect(annotationsName).not.toContain(AProperty.name);
            expect(annotationsName).not.toContain(XProperty.name);
            expect(annotationsName).not.toContain(AMethod.name);
            expect(annotationsName).not.toContain(XMethod.name);
        });
    });
    describe('.at(classLocation)', () => {
        function emptyClassBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(Empty));
        }

        function abcdClassBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(abcd));
        }

        function xClassBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(x));
        }
        describe('.all()', () => {
            describe('when located class uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(Object.keys(emptyClassBundle().all()).length).toEqual(0);
                });
            });
            describe('when located class uses some annotations', () => {
                it('should return all class, properties , methods & parameters annotations', () => {
                    const annotations = abcdClassBundle().all();
                    expect(annotations.length).toEqual(20);
                    const annotationsName = annotations.map((c) => c.name);
                    expect(annotationsName).toContain(AClass.name);
                    expect(annotationsName).toContain(BClass.name);
                    expect(annotationsName).toContain(DClass.name);
                    expect(annotationsName).toContain(DClass.name);
                    expect(annotationsName).toContain(AParameter.name);
                    expect(annotationsName).toContain(BParameter.name);
                    expect(annotationsName).toContain(CParameter.name);
                    expect(annotationsName).toContain(DParameter.name);
                    expect(annotationsName).toContain(AProperty.name);
                    expect(annotationsName).toContain(BProperty.name);
                    expect(annotationsName).toContain(CProperty.name);
                    expect(annotationsName).toContain(DProperty.name);
                    expect(annotationsName).toContain(AMethod.name);
                    expect(annotationsName).toContain(BMethod.name);
                    expect(annotationsName).toContain(CMethod.name);
                    expect(annotationsName).toContain(DMethod.name);
                });
            });

            describe('when parent of located class uses some annotations', () => {
                it('should return all class, properties , methods & parameters annotations of parent class', () => {
                    const annotations = xClassBundle().all();
                    expect(annotations.length).toEqual(24);
                    const annotationsName = annotations.map((c) => c.name);
                    expect(annotationsName).toContain(XClass.name);
                    expect(annotationsName).toContain(XMethod.name);
                    expect(annotationsName).toContain(XProperty.name);
                    expect(annotationsName).toContain(XParameter.name);
                    expect(annotationsName).toContain(AClass.name);
                    expect(annotationsName).toContain(BClass.name);
                    expect(annotationsName).toContain(DClass.name);
                    expect(annotationsName).toContain(DClass.name);
                    expect(annotationsName).toContain(AParameter.name);
                    expect(annotationsName).toContain(BParameter.name);
                    expect(annotationsName).toContain(CParameter.name);
                    expect(annotationsName).toContain(DParameter.name);
                    expect(annotationsName).toContain(AProperty.name);
                    expect(annotationsName).toContain(BProperty.name);
                    expect(annotationsName).toContain(CProperty.name);
                    expect(annotationsName).toContain(DProperty.name);
                    expect(annotationsName).toContain(AMethod.name);
                    expect(annotationsName).toContain(BMethod.name);
                    expect(annotationsName).toContain(CMethod.name);
                    expect(annotationsName).toContain(DMethod.name);
                });
            });
        });

        describe('.all(Annotation)', () => {
            describe('when specified annotation does not exists within the class', () => {
                it('should return an empty array', () => {
                    expect(abcdClassBundle().all(XClass)).toEqual([]);
                });
            });

            describe('when specified a CLASS annotation that exists on the class', () => {
                it('should return the requested annotation', () => {
                    const annotations = abcdClassBundle().all(AClass);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AClass.name);
                });
            });

            describe('when specified a METHOD annotation that exists within the class', () => {
                it('should return the requested annotation', () => {
                    const annotations = abcdClassBundle().all(AMethod);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AMethod.name);
                });
            });

            describe('when specified a PROPERTY annotation that exists within the class', () => {
                it('should return the requested annotation', () => {
                    const annotations = abcdClassBundle().all(AProperty);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AProperty.name);
                });
            });

            describe('when specified a PARAMETER annotation that exists within the class', () => {
                it('should return the requested annotation', () => {
                    const annotations = abcdClassBundle().all(AParameter);
                    expect(annotations.length).toEqual(2);
                    expect(annotations.map((a) => a.name)).toEqual([AParameter.name, AParameter.name]);
                });
            });
        });
        describe('.onProperty()', () => {
            describe('when located property uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(emptyClassBundle().onProperty().length).toEqual(0);
                });
            });
            describe('when located property uses some annotations', () => {
                it('should return all property annotations', () => {
                    const annotations = abcdClassBundle().onProperty();
                    expect(annotations.length).toEqual(4);
                    const annotationsName = annotations.map((a) => a.name);
                    expect(annotationsName).toContain(AProperty.name);
                    expect(annotationsName).toContain(BProperty.name);
                    expect(annotationsName).toContain(CProperty.name);
                    expect(annotationsName).toContain(DProperty.name);
                    expect(annotationsName).not.toContain(XProperty.name);
                });
            });
        });

        describe('.onProperty(Annotation)', () => {
            describe('when specified annotation does not exist within the class', () => {
                it('should return an empty array', () => {
                    const annotations = abcdClassBundle().onProperty(XProperty);
                    expect(annotations.length).toEqual(0);
                });
            });

            describe('when specified annotation exists within the class', () => {
                it('should return the requested annotation', () => {
                    const annotations = abcdClassBundle().onProperty(AProperty);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AProperty.name);
                });
            });
        });
        describe('.onMethod()', () => {
            describe('when located class uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(emptyClassBundle().onMethod().length).toEqual(0);
                });
            });

            describe('when located class uses some annotations', () => {
                it('should return all method annotations', () => {
                    const annotations = abcdClassBundle().onMethod();
                    expect(annotations.length).toEqual(4);
                    expect(annotations.map((a) => a.name)).toContain(AMethod.name);
                    expect(annotations.map((a) => a.name)).toContain(BMethod.name);
                    expect(annotations.map((a) => a.name)).toContain(CMethod.name);
                    expect(annotations.map((a) => a.name)).toContain(DMethod.name);
                    expect(annotations.map((a) => a.name)).not.toContain(XMethod.name);
                });
            });
        });
        describe('.onMethod(Annotation)', () => {
            describe('when the given an annotation does not exist within the class', () => {
                it('should return an empty array', () => {
                    expect(abcdClassBundle().onMethod(XMethod).length).toEqual(0);
                });
            });

            describe('when the given an annotation exists within the class', () => {
                it('should return the requested annotation', () => {
                    const annotations = abcdClassBundle().onMethod(AMethod);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AMethod.name);
                });
            });
        });
        describe('.onParameter()', () => {
            describe('when located class uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(emptyClassBundle().onParameter().length).toEqual(0);
                });
            });
            describe('when located class uses some annotations', () => {
                it('should return all parameters annotations', () => {
                    const annotations = abcdClassBundle().onParameter();
                    expect(annotations.length).toEqual(8);
                    const annotationsName = annotations.map((a) => a.name);
                    expect(annotationsName).toContain(AParameter.name);
                    expect(annotationsName).toContain(BParameter.name);
                    expect(annotationsName).toContain(CParameter.name);
                    expect(annotationsName).toContain(DParameter.name);
                    expect(annotationsName).not.toContain(XParameter.name);
                });
            });
        });
        describe('.onParameter(Annotation)', () => {
            describe('when the given an annotation does not exist within the class', () => {
                it('should return the requested annotation', () => {
                    const annotations = abcdClassBundle().onParameter(XParameter);
                    expect(annotations.length).toEqual(0);
                });
            });
            describe('when the given an annotation exists within the class', () => {
                it('should return the requested annotation', () => {
                    const annotations = abcdClassBundle().onParameter(AParameter);
                    expect(annotations.length).toEqual(2);
                    expect(annotations.map((a) => a.name)).toEqual([AParameter.name, AParameter.name]);
                });
            });
        });
        describe('.onClass()', () => {
            describe('when located class does not use no annotation', () => {
                it('should return an empty array', () => {
                    expect(emptyClassBundle().onClass().length).toEqual(0);
                });
            });
            describe('when located class uses some annotations', () => {
                it('should return all class annotations on the class', () => {
                    const annotations = abcdClassBundle().onClass();
                    expect(annotations.length).toEqual(4);
                    const annotationsName = annotations.map((a) => a.name);
                    expect(annotationsName).toContain(AClass.name);
                    expect(annotationsName).toContain(BClass.name);
                    expect(annotationsName).toContain(CClass.name);
                    expect(annotationsName).toContain(DClass.name);
                    expect(annotationsName).not.toContain(XClass.name);
                });
            });
        });

        describe('.onClass(Annotation)', () => {
            describe('when the given an annotation does not exist on the class', () => {
                it('should return the requested annotation', () => {
                    const annotations = abcdClassBundle().onClass(XClass);
                    expect(annotations.length).toEqual(0);
                });
            });

            describe('when the given an annotation exists on the class', () => {
                it('should return the requested annotation', () => {
                    const annotations = abcdClassBundle().onClass(AClass);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AClass.name);
                });
            });
        });
    });

    describe('.at(propertyLocation)', () => {
        function emptyPropertyBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(Empty).somePropAB);
        }

        function abPropertyBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(abcd).somePropAB);
        }
        describe('.all()', () => {
            describe('when located property uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(Object.keys(emptyPropertyBundle().all()).length).toEqual(0);
                });
            });
            describe('when located property uses some annotations', () => {
                it('should return all property annotations', () => {
                    const annotations = abPropertyBundle().all();
                    expect(annotations.length).toEqual(2);
                    const annotationsName = annotations.map((c) => c.name);
                    expect(annotationsName).toContain(AProperty.name);
                    expect(annotationsName).toContain(BProperty.name);
                    expect(annotationsName).not.toContain(CProperty.name);
                    expect(annotationsName).not.toContain(DProperty.name);
                });
            });
        });

        describe('.all(Annotation)', () => {
            describe('when specified annotation does not exists on the property', () => {
                it('should return an empty array', () => {
                    expect(abPropertyBundle().all(CProperty)).toEqual([]);
                });
            });

            describe('when specified a PROPERTY annotation that exists on the property', () => {
                it('should return the requested annotation', () => {
                    const annotations = abPropertyBundle().all(AProperty);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AProperty.name);
                });
            });
        });
        describe('.onProperty()', () => {
            describe('when located property uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(emptyPropertyBundle().onProperty().length).toEqual(0);
                });
            });

            describe('when located property uses some annotations', () => {
                it('should return all property annotations', () => {
                    const annotations = abPropertyBundle().onProperty();
                    expect(annotations.length).toEqual(2);
                    const annotationsName = annotations.map((a) => a.name);
                    expect(annotationsName).toContain(AProperty.name);
                    expect(annotationsName).toContain(BProperty.name);
                    expect(annotationsName).not.toContain(CProperty.name);
                    expect(annotationsName).not.toContain(DProperty.name);
                });
            });
        });
        describe('.onProperty(Annotation)', () => {
            describe('when the given an annotation does not exist on the property', () => {
                it('should return an empty array', () => {
                    expect(abPropertyBundle().onProperty(CProperty).length).toEqual(0);
                });
            });

            describe('when the given an annotation exists on the property', () => {
                it('should return the requested annotation', () => {
                    const annotations = abPropertyBundle().onProperty(AProperty);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AProperty.name);
                });
            });
        });
    });

    describe('.at(methodLocation)', () => {
        function emptyMethodBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(Empty).someMethodAB);
        }

        function abMethodBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(abcd).someMethodAB);
        }
        describe('.all()', () => {
            describe('when located method uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(Object.keys(emptyMethodBundle().all()).length).toEqual(0);
                });
            });
            describe('when located method uses some annotations', () => {
                it('should return all methods & parameters annotations', () => {
                    const annotations = abMethodBundle().all();
                    expect(annotations.length).toEqual(6);
                    const annotationsName = annotations.map((c) => c.name);
                    expect(annotationsName).toContain(AParameter.name);
                    expect(annotationsName).toContain(BParameter.name);
                    expect(annotationsName).toContain(AMethod.name);
                    expect(annotationsName).toContain(BMethod.name);
                    expect(annotationsName).not.toContain(DMethod.name);
                    expect(annotationsName).not.toContain(DParameter.name);
                });
            });
        });

        describe('.all(Annotation)', () => {
            describe('when specified annotation does not exists on the method', () => {
                it('should return an empty array', () => {
                    expect(abMethodBundle().all(CMethod)).toEqual([]);
                });
            });

            describe('when specified a METHOD annotation that exists on the method', () => {
                it('should return the requested annotation', () => {
                    const annotations = abMethodBundle().all(AMethod);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AMethod.name);
                });
            });

            describe("when specified a PARAMETER annotation that on the method's parameters", () => {
                it('should return the requested annotation', () => {
                    const annotations = abMethodBundle().all(AParameter);
                    expect(annotations.length).toEqual(2);
                    expect(annotations.map((a) => a.name)).toEqual([AParameter.name, AParameter.name]);
                });
            });
        });
        describe('.onMethod()', () => {
            describe('when located method uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(emptyMethodBundle().onMethod().length).toEqual(0);
                });
            });

            describe('when located method uses some annotations', () => {
                it('should return all method annotations', () => {
                    const annotations = abMethodBundle().onMethod();
                    expect(annotations.length).toEqual(2);
                    expect(annotations.map((a) => a.name)).toContain(AMethod.name);
                    expect(annotations.map((a) => a.name)).toContain(BMethod.name);
                    expect(annotations.map((a) => a.name)).not.toContain(CMethod.name);
                    expect(annotations.map((a) => a.name)).not.toContain(DMethod.name);
                    expect(annotations.map((a) => a.name)).not.toContain(AParameter.name);
                });
            });
        });
        describe('.onMethod(Annotation)', () => {
            describe('when the given an annotation does not exist on the method', () => {
                it('should return an empty array', () => {
                    expect(abMethodBundle().onMethod(XMethod).length).toEqual(0);
                });
            });

            describe('when the given an annotation exists on the method', () => {
                it('should return the requested annotation', () => {
                    const annotations = abMethodBundle().onMethod(AMethod);
                    expect(annotations.length).toEqual(1);
                    expect(annotations[0].name).toEqual(AMethod.name);
                });
            });
        });
        describe('.onParameter()', () => {
            describe('when located method uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(emptyMethodBundle().onParameter().length).toEqual(0);
                });
            });
            describe('when located method uses some annotations', () => {
                it('should return all parameters annotations', () => {
                    const annotations = abMethodBundle().onParameter();
                    expect(annotations.length).toEqual(4);
                    const annotationsName = annotations.map((a) => a.name);
                    expect(annotationsName).toContain(AParameter.name);
                    expect(annotationsName).toContain(BParameter.name);
                    expect(annotationsName).not.toContain(CParameter.name);
                    expect(annotationsName).not.toContain(DParameter.name);
                });
            });
        });
        describe('.onParameter(Annotation)', () => {
            describe("when the given an annotation does not exist on the method's parameters", () => {
                it('should return the requested annotation', () => {
                    const annotations = abMethodBundle().onParameter(XParameter);
                    expect(annotations.length).toEqual(0);
                });
            });
            describe("when the given an annotation exists within the method's parameters", () => {
                it('should return the requested annotation', () => {
                    const annotations = abMethodBundle().onParameter(AParameter);
                    expect(annotations.length).toEqual(2);
                    expect(annotations.map((a) => a.name)).toEqual([AParameter.name, AParameter.name]);
                });
            });
        });
    });

    describe('.at(parametersLocation)', () => {
        function emptyParametersBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(Empty).someMethodAB?.args);
        }

        function abParametersBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(abcd).someMethodAB.args);
        }
        describe('.all()', () => {
            describe('when located parameters uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(Object.keys(emptyParametersBundle().all()).length).toEqual(0);
                });
            });
            describe('when located parameters uses some annotations', () => {
                it('should return all parameters annotations', () => {
                    const annotations = abParametersBundle().all();
                    expect(annotations.length).toEqual(4);
                    const annotationsName = annotations.map((c) => c.name);
                    expect(annotationsName).toContain(AParameter.name);
                    expect(annotationsName).toContain(BParameter.name);
                    expect(annotationsName).not.toContain(AMethod.name);
                    expect(annotationsName).not.toContain(BMethod.name);
                    expect(annotationsName).not.toContain(CParameter.name);
                    expect(annotationsName).not.toContain(DParameter.name);
                });
            });
        });

        describe('.all(Annotation)', () => {
            describe('when specified annotation does not exists on one of the parameters', () => {
                it('should return an empty array', () => {
                    expect(abParametersBundle().all(CParameter)).toEqual([]);
                });
            });

            describe('when specified a PARAMETER annotation that exists on one of the parameters', () => {
                it('should return the requested annotation', () => {
                    const annotations = abParametersBundle().all(AParameter);
                    expect(annotations.length).toEqual(2);
                    expect(annotations.map((a) => a.name)).toEqual([AParameter.name, AParameter.name]);
                });
            });
        });
    });
    describe('.at(parametersLocation[i])', () => {
        function emptyParametersBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(Empty).someMethodAB?.args[0]);
        }

        function abParametersBundle() {
            return rootBundle.at(weaverContext.annotations.location.of(abcd).someMethodAB.args[0]);
        }
        describe('.all()', () => {
            describe('when located parameter uses no annotation', () => {
                it('should return an empty array', () => {
                    expect(Object.keys(emptyParametersBundle().all()).length).toEqual(0);
                });
            });
            describe('when located parameter uses some annotations', () => {
                it('should return all parameter annotations', () => {
                    const annotations = abParametersBundle().all();
                    expect(annotations.length).toEqual(2);
                    const annotationsName = annotations.map((c) => c.name);
                    expect(annotationsName).toContain(AParameter.name);
                    expect(annotationsName).toContain(BParameter.name);
                    expect(annotationsName).not.toContain(DParameter.name);
                });
            });
        });

        describe('.all(Annotation)', () => {
            describe('when specified annotation does not exists on that specific parameter', () => {
                it('should return an empty array', () => {
                    expect(abParametersBundle().all(CParameter)).toEqual([]);
                });
            });

            describe('when specified a PARAMETER annotation that exists on that specific parameter', () => {
                it('should return the requested annotation', () => {
                    const annotations = abParametersBundle().all(AParameter);
                    expect(annotations.length).toEqual(1);
                    expect(annotations.map((a) => a.name)).toEqual([AParameter.name]);
                });
            });
        });
    });
});
