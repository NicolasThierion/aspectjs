/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import {
  Annotation,
  AnnotationFactory,
  AnnotationKind,
} from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import { AdviceContext } from '../advice/advice.context';
import { AfterReturn } from '../advices/after-return/after-return.annotation';
import { AfterThrow } from '../advices/after-throw/after-throw.annotation';
import { After } from '../advices/after/after.annotation';
import { Around } from '../advices/around/around.annotation';
import { Before } from '../advices/before/before.annotation';
import { Compile } from '../advices/compile/compile.annotation';
import { Aspect } from '../aspect/aspect.annotation';
import { on } from '../pointcut/pointcut-expression.factory';
import { getWeaver } from '../weaver/context/weaver.context.global';
import { WeaverModule } from '../weaver/weaver.module';
import { AnnotationMixin } from './annotation-mixin';

describe(`AnnotationMixin`, () => {
  describe('configured to bind decorator ADecorator(<args>) to annotation B(<args>)', () => {
    const af = new AnnotationFactory('test');
    let annotationMixin: AnnotationMixin;

    let classDecoratorSpy = jest.fn();
    let methodDecoratorSpy = jest.fn();
    let propertyDecoratorSpy = jest.fn();
    let parameterDecoratorSpy = jest.fn();

    let decoratedClassSpy = jest.fn();
    let decoratedMethodSpy = jest.fn();
    let decoratedPropertySpy = jest.fn();
    let decoratedParameterSpy = jest.fn();

    let BClass: Annotation<
      AnnotationKind.CLASS,
      (a: string, b: string) => void
    >;
    let BMethod: Annotation<
      AnnotationKind.METHOD,
      (a: string, b: string) => void
    >;
    let BProperty: Annotation<
      AnnotationKind.PROPERTY,
      (a: string, b: string) => void
    >;
    let BParameter: Annotation<
      AnnotationKind.PARAMETER,
      (a: string, b: string) => void
    >;
    beforeEach(() => {
      BClass = af.create(
        AnnotationKind.CLASS,
        'BClass',
        function (a: string, b: string) {},
      );
      BMethod = af.create(
        AnnotationKind.METHOD,
        'BMethod',
        function (a: string, b: string) {},
      );
      BProperty = af.create(
        AnnotationKind.PROPERTY,
        'BProperty',
        function (a: string, b: string) {},
      );
      BParameter = af.create(
        AnnotationKind.PARAMETER,
        'BParameter',
        function (a: string, b: string) {},
      );

      classDecoratorSpy = jest.fn();
      methodDecoratorSpy = jest.fn();
      propertyDecoratorSpy = jest.fn();
      parameterDecoratorSpy = jest.fn();

      decoratedClassSpy = jest.fn();
      decoratedMethodSpy = jest.fn();
      decoratedPropertySpy = jest.fn();
      decoratedParameterSpy = jest.fn();

      function AClassDecorator(
        a: Uppercase<string>,
        b: Uppercase<string>,
      ): ClassDecorator {
        classDecoratorSpy(a, b);
        return (ctor) => {
          return decoratedClassSpy(ctor);
        };
      }

      function AMethodDecorator(
        a: Uppercase<string>,
        b: Uppercase<string>,
      ): MethodDecorator {
        methodDecoratorSpy(a, b);
        return (target, propertyKey, descriptor) => {
          return decoratedMethodSpy(target, propertyKey, descriptor);
        };
      }

      function BPropertyDecorator(
        a: Uppercase<string>,
        b: Uppercase<string>,
      ): PropertyDecorator {
        propertyDecoratorSpy(a, b);
        return (target, propertyKey) => {
          return decoratedPropertySpy(target, propertyKey);
        };
      }

      function AParameterDecorator(
        a: Uppercase<string>,
        b: Uppercase<string>,
      ): ParameterDecorator {
        parameterDecoratorSpy(a, b);
        return (target, propertyKey, parameterIndex) => {
          return decoratedParameterSpy(target, propertyKey, parameterIndex);
        };
      }

      annotationMixin = new AnnotationMixin()
        .bind(BClass, (a: string, b: string) =>
          AClassDecorator(
            a.toLocaleUpperCase() as Uppercase<string>,
            b.toLocaleUpperCase() as Uppercase<string>,
          ),
        )
        .bind(BMethod, (a: string, b: string) =>
          AMethodDecorator(
            a.toLocaleUpperCase() as Uppercase<string>,
            b.toLocaleUpperCase() as Uppercase<string>,
          ),
        )
        .bind(BProperty, (a: string, b: string) =>
          BPropertyDecorator(
            a.toLocaleUpperCase() as Uppercase<string>,
            b.toLocaleUpperCase() as Uppercase<string>,
          ),
        )
        .bind(BParameter, (a: string, b: string) =>
          AParameterDecorator(
            a.toLocaleUpperCase() as Uppercase<string>,
            b.toLocaleUpperCase() as Uppercase<string>,
          ),
        );
      classDecoratorSpy = jest.fn();
      methodDecoratorSpy = jest.fn();
      propertyDecoratorSpy = jest.fn();
      parameterDecoratorSpy = jest.fn();
      decoratedClassSpy = jest.fn();
      decoratedMethodSpy = jest.fn();
      decoratedPropertySpy = jest.fn();
      decoratedParameterSpy = jest.fn();

      configureTesting(WeaverModule);

      @Aspect()
      class AAspect {}
      getWeaver().enable(annotationMixin.createAspect(new AAspect()));
    });

    describe('using the X annotation on a class', () => {
      it('calls the bound decorator', () => {
        decoratedClassSpy = jest.fn(function () {
          return function MyClassDecorated(this: any, x: string, y: string) {
            this.x = x.toLocaleUpperCase();
            this.y = y.toLocaleUpperCase();
          };
        });
        @BClass('a', 'b')
        class MyClass {
          constructor(
            public x: string,
            public y: string,
          ) {}
        }
        expect(classDecoratorSpy).toHaveBeenCalledWith('A', 'B');
        expect(decoratedClassSpy.mock.calls[0][0].name).toEqual('MyClass');
        const myClass = new MyClass('x', 'y');
        expect(myClass.x).toEqual('X');
        expect(myClass.y).toEqual('Y');
      });
    });

    describe('using the X annotation on a method', () => {
      it('calls the bound decorator', () => {
        decoratedMethodSpy = jest.fn(function () {
          return function MyMethodDecorated(this: any, x: string, y: string) {
            this.x = x.toLocaleUpperCase();
            this.y = y.toLocaleUpperCase();
          };
        });
        class MyClass {
          constructor(
            public x = 'x',
            public y = 'y',
          ) {}
          @BMethod('a', 'b')
          m(x: string, y: string) {}
        }
        expect(methodDecoratorSpy).toHaveBeenCalledWith('A', 'B');
        const [proto, propertyKey, descriptor] =
          decoratedMethodSpy.mock.calls[0];
        expect(proto).toBeDefined();
        expect(propertyKey).toEqual('m');
        expect(descriptor).toBeDefined();
        const myClass = new MyClass();
        expect(myClass.x).toEqual('x');
        expect(myClass.y).toEqual('y');
        myClass.m('x', 'y');
        expect(myClass.x).toEqual('X');
        expect(myClass.y).toEqual('Y');
      });
    });

    describe('using the X annotation on a property', () => {
      it('calls the bound decorator', () => {
        class MyClass {
          @BProperty('a', 'b')
          prop = 'x';
        }
        expect(propertyDecoratorSpy).toHaveBeenCalledWith('A', 'B');
        const [proto, propertyKey] = decoratedPropertySpy.mock.calls[0];
        expect(proto).toBeDefined();
        expect(propertyKey).toEqual('prop');
      });
    });

    describe('using the X annotation on a parameter', () => {
      it('calls the bound decorator', () => {
        class MyClass {
          m(
            @BParameter('a', 'b')
            param: string,
          ) {}
        }
        new MyClass();
        expect(parameterDecoratorSpy).toHaveBeenCalledWith('A', 'B');
        const [proto, propertyKey, paramIndex] =
          decoratedParameterSpy.mock.calls[0];
        expect(proto).toBeDefined();
        expect(propertyKey).toEqual('m');
        expect(paramIndex).toEqual(0);
      });
    });
  });

  describe('configured to bind annotation A(<args>) to annotation B(<args>)', () => {
    const af = new AnnotationFactory('test');
    let annotationMixin: AnnotationMixin;

    let A: Annotation<any, (a: string, b: string) => void>;
    let B: Annotation<any, (a: string, b: string) => void>;

    beforeEach(() => {
      A = af.create('A', function (a: string, b: string) {});
      B = af.create('B', function (a: string, b: string) {});

      annotationMixin = new AnnotationMixin().bind(A, B);
      configureTesting(WeaverModule);
      getWeaver().enable(annotationMixin.createAspect('test'));
    });
    describe('using the A annotation on a class', () => {
      it.each([Compile, Before, Around, After, AfterReturn, AfterThrow])(
        'applies the %s advices on annotation B',
        (annotation) => {
          const adviceBSpy = jest.fn();
          @Aspect()
          class BAspect {
            @annotation(on.classes.withAnnotations(B))
            adviceB(ctxt: AdviceContext) {
              adviceBSpy(ctxt);
            }
          }

          getWeaver().enable(new BAspect());
          @A('a', 'b')
          class X {
            constructor() {
              if (annotation === AfterThrow) {
                throw new Error('expected error');
              }
            }
          }
          if (annotation !== Compile) {
            expect(adviceBSpy).not.toHaveBeenCalled();
            new X();
          }
          expect(adviceBSpy).toHaveBeenCalledTimes(1);
        },
      );
    });
    describe('using the A annotation on a method', () => {
      it.each([Compile, Before, Around, After, AfterReturn, AfterThrow])(
        'applies the %s advices on annotation B',
        (annotation) => {
          const adviceBSpy = jest.fn();
          @Aspect()
          class BAspect {
            @annotation(on.methods.withAnnotations(B))
            adviceB(ctxt: AdviceContext) {
              adviceBSpy(ctxt);
            }
          }

          getWeaver().enable(new BAspect());
          class X {
            @A('a', 'b')
            m(@A('1', '2') arg?: any) {
              if (annotation === AfterThrow) {
                throw new Error('expected error');
              }
            }
          }

          if (annotation !== Compile) {
            expect(adviceBSpy).not.toHaveBeenCalled();
            new X().m('arg');
          }
          expect(adviceBSpy).toHaveBeenCalledTimes(1);
        },
      );
    });

    describe('using the A annotation on a property', () => {
      it.each([
        Compile,
        Before,
        Around,
        After,
        AfterReturn,
        //AfterThrow
      ])('applies the %s advices on annotation B', (annotation) => {
        const adviceBSpy = jest.fn();
        @Aspect()
        class BAspect {
          @annotation(on.properties.withAnnotations(B))
          adviceB(ctxt: AdviceContext) {
            adviceBSpy(ctxt);
          }
        }

        getWeaver().enable(new BAspect());
        class X {
          @A('a', 'b')
          declare prop: string;
          constructor() {
            this.prop = 'a';
          }
        }

        if (annotation !== Compile) {
          expect(adviceBSpy).not.toHaveBeenCalled();
          const x = new X();
          const prop = x.prop;
        }
        expect(adviceBSpy).toHaveBeenCalledTimes(1);
      });
    });
    describe('using the A annotation on a parameter', () => {
      it.each([Compile, Before, Around, After, AfterReturn, AfterThrow])(
        'applies the %s advices on annotation B',
        (annotation) => {
          const adviceBSpy = jest.fn();
          @Aspect()
          class BAspect {
            @annotation(on.parameters.withAnnotations(B))
            adviceB(ctxt: AdviceContext) {
              adviceBSpy(ctxt);
            }
          }

          getWeaver().enable(new BAspect());
          class X {
            method(
              @A('a', 'b')
              x: string,
            ) {
              if (annotation === AfterThrow) {
                throw new Error('expected error');
              }
            }
          }
          if (annotation !== Compile) {
            expect(adviceBSpy).not.toHaveBeenCalled();
            const x = new X();
            x.method('x');
          }
          expect(adviceBSpy).toHaveBeenCalledTimes(1);
        },
      );
    });
  });
});
