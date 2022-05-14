import { AnnotationFactory, type Annotation } from '@aspectjs/common';
import { ReflectContext } from '../../reflect/reflect.context';
import { AnnotationRegistry, AnnotationSelector } from './annotation.registry';
import { annotations } from './annotations';

let annotationRegistry: AnnotationRegistry;

let AClassAnnotation: Annotation;

let A = class A {};
let B = class B {};
let X = class X {};

// represents annotations on class A
let A_ANNOTATIONS: Annotation[] = [];
let A_CLASS_ANNOTATIONS: Annotation[] = [];
let A_PROPERTY_ANNOTATIONS: Annotation[] = [];
let A_METHOD_ANNOTATIONS: Annotation[] = [];
let A_PARAMETER_ANNOTATIONS: Annotation[] = [];
// represents annotations on class B
let B_ANNOTATIONS: Annotation[] = [];
let B_CLASS_ANNOTATIONS: Annotation[] = [];
let B_PROPERTY_ANNOTATIONS: Annotation[] = [];
let B_METHOD_ANNOTATIONS: Annotation[] = [];
let B_PARAMETER_ANNOTATIONS: Annotation[] = [];

let A1Annotation: any;
let A2Annotation: any;
let B1Annotation: any;
let B2Annotation: any;
let A1ClassAnnotation: any;
let A2ClassAnnotation: any;
let B1ClassAnnotation: any;
let B2ClassAnnotation: any;
let A1PropertyAnnotation: any;
let A2PropertyAnnotation: any;
let B1PropertyAnnotation: any;
let B2PropertyAnnotation: any;
let A1MethodAnnotation: any;
let A2MethodAnnotation: any;
let B1MethodAnnotation: any;
let B2MethodAnnotation: any;
let A1ParameterAnnotation: any;
let A2ParameterAnnotation: any;
let B1ParameterAnnotation: any;
let B2ParameterAnnotation: any;
let XAnnotation: any;
function setup() {
  A = class A {};
  B = class B {};
  X = class X {};
  annotationRegistry =
    ReflectContext.configureTesting().get<AnnotationRegistry>(
      'annotationRegistry',
    );

  const af = new AnnotationFactory('test');
  A1Annotation = af.create('A1Annotation');
  A2Annotation = af.create('A2Annotation');
  B1Annotation = af.create('B1Annotation');
  B2Annotation = af.create('B2Annotation');
  A1ClassAnnotation = af.create('A1ClassAnnotation');
  A2ClassAnnotation = af.create('A2ClassAnnotation');
  B1ClassAnnotation = af.create('B1ClassAnnotation');
  B2ClassAnnotation = af.create('B2ClassAnnotation');
  A1PropertyAnnotation = af.create('A1PropertyAnnotation');
  A2PropertyAnnotation = af.create('A2PropertyAnnotation');
  B1PropertyAnnotation = af.create('B1PropertyAnnotation');
  B2PropertyAnnotation = af.create('B2PropertyAnnotation');
  A1MethodAnnotation = af.create('A1MethodAnnotation');
  A2MethodAnnotation = af.create('A2MethodAnnotation');
  B1MethodAnnotation = af.create('B1MethodAnnotation');
  B2MethodAnnotation = af.create('B2MethodAnnotation');
  A1ParameterAnnotation = af.create('A1ParameterAnnotation');
  A2ParameterAnnotation = af.create('A2ParameterAnnotation');
  B1ParameterAnnotation = af.create('B1ParameterAnnotation');
  B2ParameterAnnotation = af.create('B2ParameterAnnotation');
  XAnnotation = af.create('XAnnotation');

  @A1Annotation()
  @A2Annotation()
  @A1ClassAnnotation()
  @A2ClassAnnotation()
  class _A extends A {
    @A1Annotation()
    @A1PropertyAnnotation()
    prop1!: string;

    @A2Annotation()
    @A2PropertyAnnotation()
    prop2!: string;

    @A1Annotation()
    @A1MethodAnnotation()
    fn1(
      @A1Annotation()
      @A1ParameterAnnotation()
      _arg: string,
    ) {}

    @A2Annotation()
    @A2MethodAnnotation()
    fn2(
      @A2Annotation()
      @A2ParameterAnnotation()
      _arg: string,
    ) {}

    fnX() {}
  }
  A = _A;
  A_CLASS_ANNOTATIONS = [
    A1Annotation,
    A2Annotation,
    A1ClassAnnotation,
    A2ClassAnnotation,
  ];
  A_PROPERTY_ANNOTATIONS = [
    A1Annotation,
    A1PropertyAnnotation,
    A2Annotation,
    A2PropertyAnnotation,
  ];
  A_METHOD_ANNOTATIONS = [
    A1Annotation,
    A1MethodAnnotation,
    A2Annotation,
    A2MethodAnnotation,
  ];
  A_PARAMETER_ANNOTATIONS = [
    A1Annotation,
    A1ParameterAnnotation,
    A2Annotation,
    A2ParameterAnnotation,
  ];
  A_ANNOTATIONS = [
    ...A_CLASS_ANNOTATIONS,
    ...A_PROPERTY_ANNOTATIONS,
    ...A_METHOD_ANNOTATIONS,
    ...A_PARAMETER_ANNOTATIONS,
  ];

  @B1Annotation()
  @B2Annotation()
  @B1ClassAnnotation()
  @B2ClassAnnotation()
  class _B extends B {
    @B1Annotation()
    @B1PropertyAnnotation()
    prop1!: string;

    @B2Annotation()
    @B2PropertyAnnotation()
    prop2!: string;

    @B1Annotation()
    @B1MethodAnnotation()
    fn1(
      @B1Annotation()
      @B1ParameterAnnotation()
      _arg: string,
    ) {}

    @B2Annotation()
    @B2MethodAnnotation()
    fn2(
      @B2Annotation()
      @B2ParameterAnnotation()
      _arg: string,
    ) {}

    fnX() {}
  }
  B = _B;
  B_CLASS_ANNOTATIONS = [
    B1Annotation,
    B2Annotation,
    B1ClassAnnotation,
    B2ClassAnnotation,
  ];
  B_PROPERTY_ANNOTATIONS = [
    B1Annotation,
    B1PropertyAnnotation,
    B2Annotation,
    B2PropertyAnnotation,
  ];
  B_METHOD_ANNOTATIONS = [
    B1Annotation,
    B1MethodAnnotation,
    B2Annotation,
    B2MethodAnnotation,
  ];
  B_PARAMETER_ANNOTATIONS = [
    B1Annotation,
    B1ParameterAnnotation,
    B2Annotation,
    B2ParameterAnnotation,
  ];
  B_ANNOTATIONS = [
    ...B_CLASS_ANNOTATIONS,
    ...B_PROPERTY_ANNOTATIONS,
    ...B_METHOD_ANNOTATIONS,
    ...B_PARAMETER_ANNOTATIONS,
  ];

  class _X extends X {
    prop!: string;

    fn(_arg: string) {}
  }
  X = _X;
  annotationRegistry.find = jest.fn(annotationRegistry.find);
}
describe('annotations()', () => {
  beforeEach(setup);
  it('calls s', () => {
    annotations();
    expect(annotationRegistry.find).toHaveBeenCalledTimes(1);
    expect(annotationRegistry.find).toHaveBeenCalledWith();
  });
});

describe('annotations(AClassAnnotation)', () => {
  beforeEach(setup);

  it('calls AnnotationRegistry.find(AClassAnnotation)', () => {
    annotations(AClassAnnotation);
    expect(annotationRegistry.find).toHaveBeenCalledTimes(1);
    expect(annotationRegistry.find).toHaveBeenCalledWith(AClassAnnotation);
  });
});

describe('AnnotationRegistry', () => {
  beforeEach(setup);

  describe('.find()', () => {
    let s: AnnotationSelector;

    beforeEach(() => (s = annotationRegistry.find()));
    it('returns an AnnotationSelector', () => {
      expect(s).toBeInstanceOf(AnnotationSelector);
    });

    describe('.all()', () => {
      it('returns all annotations found all over the code', () => {
        expect(s.all().map((a) => a.annotation)).toEqual(
          expect.arrayContaining([...A_ANNOTATIONS, ...B_ANNOTATIONS]),
        );
      });
    });

    describe(`.all(SomeClass);`, () => {
      describe(`if "SomeClass" has annotations`, () => {
        it('returns all annotations found within class SomeClass', () => {
          expect(s.all(A).map((a) => a.annotation)).toEqual(
            expect.arrayContaining(A_ANNOTATIONS),
          );
        });
      });
      describe(`if "SomeClass" has no annotation`, () => {
        it('returns empty array', () => {
          expect(s.all(X).length).toEqual(0);
        });
      });
    });

    // describe(`.all(someClassInstance);`, () => {
    //   describe(`if "SomeClass" has annotations`, () => {
    //     it('returns all annotations found within class SomeClass', () => {
    //       expect(s.all(new A()).map((a) => a.annotation)).toEqual(
    //         expect.arrayContaining(A_ANNOTATIONS),
    //       );
    //     });
    //   });
    //   describe(`if "SomeClass" has no annotation`, () => {
    //     it('returns empty array', () => {
    //       expect(s.all(new X())).toEqual([]);
    //     });
    //   });
    // });

    describe(`.onClass()`, () => {
      it('returns all annotations found on all classes', () => {
        expect(s.onClass().map((a) => a.annotation)).toEqual(
          expect.arrayContaining([
            ...A_CLASS_ANNOTATIONS,
            ...B_CLASS_ANNOTATIONS,
          ]),
        );
      });
    });

    describe(`.onClass(A)`, () => {
      it('returns all annotations found on class A', () => {
        expect(s.onClass().map((a) => a.annotation)).toEqual(
          expect.arrayContaining(A_CLASS_ANNOTATIONS),
        );
      });
    });
    describe(`.onMethod()`, () => {
      it('returns all annotations found on all methods', () => {
        expect(s.onMethod().map((a) => a.annotation)).toEqual(
          expect.arrayContaining([
            ...A_METHOD_ANNOTATIONS,
            ...B_METHOD_ANNOTATIONS,
          ]),
        );
      });
    });
    describe(`.onMethod(A)`, () => {
      describe('if methods on A have annotations', () => {
        it('returns all annotations found methods of class A', () => {
          expect(s.onMethod(A).map((a) => a.annotation)).toEqual(
            expect.arrayContaining(A_METHOD_ANNOTATIONS),
          );
        });
      });
      describe('if methods on A do not have annotations', () => {
        it('returns all annotations found methods of class A', () => {
          expect(s.onMethod(X)).toEqual([]);
        });
      });
    });
    describe(`.onMethod(A, 'fn')`, () => {
      describe('if "fn" method exists', () => {
        it('returns all annotations found on method "A.fn"', () => {
          expect(s.onMethod(A as any, 'fn1').map((a) => a.annotation)).toEqual(
            expect.arrayContaining([A1MethodAnnotation, A1Annotation]),
          );
        });
      });

      describe('if "fn" method does not exist', () => {
        it('returns an empty array', () => {
          expect(s.onMethod(A as any, 'fnX')).toEqual([]);
        });
      });
    });
    describe(`.onProperty()`, () => {
      it('returns all annotations found on properties', () => {
        expect(s.onProperty().map((a) => a.annotation)).toEqual(
          expect.arrayContaining([
            ...A_PROPERTY_ANNOTATIONS,
            ...B_PROPERTY_ANNOTATIONS,
          ]),
        );
      });
    });
    describe(`.onProperty(A)`, () => {
      describe('if properties on A have annotations', () => {
        it('returns all annotations found on properties', () => {
          expect(s.onProperty(A).map((a) => a.annotation)).toEqual(
            expect.arrayContaining([...A_PROPERTY_ANNOTATIONS]),
          );
        });
      });

      describe('if properties on A do not have annotations', () => {
        it('returns empty array', () => {
          expect(s.onProperty(X)).toEqual([]);
        });
      });
    });
    describe(`.onProperty(A, 'prop')`, () => {
      describe('if "prop" property exists', () => {
        it('returns all annotations found on property "A.prop"', () => {
          expect(
            s.onProperty(A as any, 'prop1').map((a) => a.annotation),
          ).toEqual(
            expect.arrayContaining([A1PropertyAnnotation, A1Annotation]),
          );
        });
      });

      describe('if "prop" property does not exist', () => {
        it('returns an empty array', () => {
          expect(s.onProperty(A as any, 'propX')).toEqual([]);
        });
      });
    });
    describe(`.onArgs()`, () => {
      it('returns all annotations found on methods arguments', () => {
        expect(s.onArgs().map((a) => a.annotation)).toEqual(
          expect.arrayContaining([
            ...A_PARAMETER_ANNOTATIONS,
            ...B_PARAMETER_ANNOTATIONS,
          ]),
        );
      });
    });
    describe(`.onArgs(A)`, () => {
      describe('if arguments on A have annotations', () => {
        it('returns all annotations found on any argument of a method of class A', () => {
          expect(s.onArgs(A).map((a) => a.annotation)).toEqual(
            expect.arrayContaining([...A_PARAMETER_ANNOTATIONS]),
          );
        });
      });

      describe('if arguments on A do not have annotations', () => {
        it('returns an empty array', () => {
          expect(s.onArgs(X)).toEqual([]);
        });
      });
    });

    describe(`.onArgs(A, 'fn')`, () => {
      describe('if method "fn" exists on class A', () => {
        it('returns all annotations found on any argument of method "A.fn"', () => {
          expect(s.onArgs(A as any, 'fn1').map((a) => a.annotation)).toEqual(
            expect.arrayContaining([A1Annotation, A1ParameterAnnotation]),
          );
        });
      });
      describe('if method "fn" does not exist on class A', () => {
        it('returns an empty array', () => {
          expect(s.onArgs(A as any, 'fnX')).toEqual(expect.arrayContaining([]));
        });
      });
    });
  });

  describe('.find(AAnnotation)', () => {
    let s: AnnotationSelector;

    describe('if "AAnnotation" is used', () => {
      beforeEach(() => (s = annotationRegistry.find(XAnnotation)));
      describe('.all()', () => {
        it('returns an empty array', () => {
          expect(s.all()).toEqual([]);
        });
      });
    });
    describe('if "AAnnotation" is used', () => {
      beforeEach(() => (s = annotationRegistry.find(A1Annotation)));

      describe('.all()', () => {
        it('returns all "AAnnotation" annotations found all over the code', () => {
          expect(s.all().map((a) => a.annotation)).toEqual(
            expect.arrayContaining(
              A_ANNOTATIONS.filter((a) => a === A1Annotation),
            ),
          );
        });
      });

      describe(`.all(SomeClass);`, () => {
        describe(`if "SomeClass" has annotations`, () => {
          it('returns all "AAnnotation" annotations found within class SomeClass', () => {
            expect(s.all(A).map((a) => a.annotation)).toEqual(
              expect.arrayContaining(
                A_ANNOTATIONS.filter((a) => a === A1Annotation),
              ),
            );
          });
        });
        describe(`if "SomeClass" has no "AAnnotation" annotation`, () => {
          it('returns empty array', () => {
            expect(s.all(B)).toEqual([]);
          });
        });
      });

      // describe(`.all(someClassInstance);`, () => {
      //   describe(`if "SomeClass" has "AAnnotation" annotations`, () => {
      //     it('returns all annotations found within class SomeClass', () => {
      //       expect(s.all(new A()).map((a) => a.annotation)).toEqual(
      //         expect.arrayContaining(
      //           A_ANNOTATIONS.filter((a) => a === A1Annotation),
      //         ),
      //       );
      //     });
      //   });
      //   describe(`if "SomeClass" has no "AAnnotation" annotation`, () => {
      //     it('returns empty array', () => {
      //       expect(s.all(new B())).toEqual([]);
      //     });
      //   });
      // });
      describe(`.onMethod()`, () => {
        it('returns all "AAnnotation" annotations found on all methods', () => {
          expect(s.onMethod().map((a) => a.annotation)).toEqual(
            expect.arrayContaining(
              A_METHOD_ANNOTATIONS.filter((a) => a === A1Annotation),
            ),
          );
        });
      });
      describe(`.onMethod(A)`, () => {
        describe('if methods on A have "AAnnotation" annotations', () => {
          it('returns all annotations found methods of class A', () => {
            expect(s.onMethod(A).map((a) => a.annotation)).toEqual(
              expect.arrayContaining(
                A_METHOD_ANNOTATIONS.filter((a) => a === A1Annotation),
              ),
            );
          });
        });
        describe('if methods on A do not have "AAnnotation" annotations', () => {
          it('returns all annotations found methods of class A', () => {
            expect(s.onMethod(B)).toEqual([]);
          });
        });
      });
      describe(`.onMethod(A, 'fn')`, () => {
        describe('if "fn" method exists', () => {
          it('returns all "AAnnotation" annotations found on method "A.fn"', () => {
            expect(
              s.onMethod(A as any, 'fn1').map((a) => a.annotation),
            ).toEqual(expect.arrayContaining([A1Annotation]));
          });
        });

        describe('if "fn" method does not have "AAnnotation" annotations', () => {
          it('returns an empty array', () => {
            expect(s.onMethod(A as any, 'fn2')).toEqual([]);
          });
        });
      });
      describe(`.onProperty()`, () => {
        it('returns all "AAnnotation" annotations found on properties', () => {
          expect(s.onProperty().map((a) => a.annotation)).toEqual(
            expect.arrayContaining(
              A_PROPERTY_ANNOTATIONS.filter((a) => a === A1Annotation),
            ),
          );
        });
      });
      describe(`.onProperty(A)`, () => {
        describe('if properties on A have "AAnnotation" annotations', () => {
          it('returns all annotations found on properties', () => {
            expect(s.onProperty(A).map((a) => a.annotation)).toEqual(
              expect.arrayContaining(
                A_PROPERTY_ANNOTATIONS.filter((a) => a === A1Annotation),
              ),
            );
          });
        });

        describe('if properties on A do not have "AAnnotation" annotations', () => {
          it('returns empty array', () => {
            expect(s.onProperty(B)).toEqual([]);
          });
        });
      });
      describe(`.onProperty(A, 'prop')`, () => {
        describe('if "prop" property exists', () => {
          it('returns all "AAnnotation" annotations found on property "A.prop"', () => {
            expect(
              s.onProperty(A as any, 'prop1').map((a) => a.annotation),
            ).toEqual(expect.arrayContaining([A1Annotation]));
          });
        });

        describe('if "prop" property does not have "AAnnotation" annotation', () => {
          it('returns an empty array', () => {
            expect(s.onProperty(A as any, 'prop2')).toEqual([]);
          });
        });
      });
      describe(`.onArgs()`, () => {
        it('returns all "AAnnotation" annotations found on methods arguments', () => {
          expect(s.onArgs().map((a) => a.annotation)).toEqual(
            expect.arrayContaining(
              A_PARAMETER_ANNOTATIONS.filter((a) => a === A1Annotation),
            ),
          );
        });
      });
      describe(`.onArgs(A)`, () => {
        describe('if arguments on A have "AAnnotation" annotations', () => {
          it('returns all annotations found on any argument of a method of class A', () => {
            expect(s.onArgs(A).map((a) => a.annotation)).toEqual(
              expect.arrayContaining(
                A_PARAMETER_ANNOTATIONS.filter((a) => a === A1Annotation),
              ),
            );
          });
        });

        describe('if arguments on A do not have "AAnnotation" annotations', () => {
          it('returns an empty array', () => {
            expect(s.onArgs(B)).toEqual([]);
          });
        });
      });

      describe(`.onArgs(A, 'fn')`, () => {
        describe('if method "fn" exists on class A', () => {
          it('returns all "AAnnotation" annotations found on any argument of method "A.fn"', () => {
            expect(s.onArgs(A as any, 'fn1').map((a) => a.annotation)).toEqual(
              expect.arrayContaining([A1Annotation]),
            );
          });
        });
        describe('if method "fn" does not have AAnnotation annotations', () => {
          it('returns an empty array', () => {
            expect(s.onArgs(B as any, 'fnX')).toEqual(
              expect.arrayContaining([]),
            );
          });
        });
      });
    });
  });
});
