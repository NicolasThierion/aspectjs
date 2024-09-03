import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import { getWeaver, WeaverModule } from '../public_api';
import { DecoratorBridgeAspect } from './decorator-bridge.aspect';

describe('DecoratorBridgeAspect', () => {
  describe('configured to bridge decorator XDecorator(<args>) to annotation X(<args>)', () => {
    const af = new AnnotationFactory('test');
    let decoratorBridgeAspect: DecoratorBridgeAspect;

    const XClass = af.create(
      AnnotationType.CLASS,
      function XClass(a: string, b: string) {},
    );
    const XMethod = af.create(
      AnnotationType.METHOD,
      function XMethod(a: string, b: string) {},
    );
    const XProperty = af.create(
      AnnotationType.PROPERTY,
      function XProperty(a: string, b: string) {},
    );
    const XParameter = af.create(
      AnnotationType.PARAMETER,
      function XParameter(a: string, b: string) {},
    );

    let classDecoratorSpy = jest.fn();
    let methodDecoratorSpy = jest.fn();
    let propertyDecoratorSpy = jest.fn();
    let parameterDecoratorSpy = jest.fn();

    let decoratedClassSpy = jest.fn();
    let decoratedMethodSpy = jest.fn();
    let decoratedPropertySpy = jest.fn();
    let decoratedParameterSpy = jest.fn();

    function XClassDecorator(
      a: Uppercase<string>,
      b: Uppercase<string>,
    ): ClassDecorator {
      classDecoratorSpy(a, b);
      return (ctor) => {
        return decoratedClassSpy(ctor);
      };
    }

    function XMethodDecorator(
      a: Uppercase<string>,
      b: Uppercase<string>,
    ): MethodDecorator {
      methodDecoratorSpy(a, b);
      return (target, propertyKey, descriptor) => {
        return decoratedMethodSpy(target, propertyKey, descriptor);
      };
    }

    function XPropertyDecorator(
      a: Uppercase<string>,
      b: Uppercase<string>,
    ): PropertyDecorator {
      propertyDecoratorSpy(a, b);
      return (target, propertyKey) => {
        return decoratedPropertySpy(target, propertyKey);
      };
    }

    function XParameterDecorator(
      a: Uppercase<string>,
      b: Uppercase<string>,
    ): ParameterDecorator {
      parameterDecoratorSpy(a, b);
      return (target, propertyKey, parameterIndex) => {
        return decoratedParameterSpy(target, propertyKey, parameterIndex);
      };
    }

    beforeEach(() => {
      decoratorBridgeAspect = new DecoratorBridgeAspect()
        .bridge(XClass, (a: string, b: string) =>
          XClassDecorator(
            a.toLocaleUpperCase() as Uppercase<string>,
            b.toLocaleUpperCase() as Uppercase<string>,
          ),
        )
        .bridge(XMethod, (a: string, b: string) =>
          XMethodDecorator(
            a.toLocaleUpperCase() as Uppercase<string>,
            b.toLocaleUpperCase() as Uppercase<string>,
          ),
        )
        .bridge(XProperty, (a: string, b: string) =>
          XPropertyDecorator(
            a.toLocaleUpperCase() as Uppercase<string>,
            b.toLocaleUpperCase() as Uppercase<string>,
          ),
        )
        .bridge(XParameter, (a: string, b: string) =>
          XParameterDecorator(
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

      getWeaver().enable(decoratorBridgeAspect);
    });

    describe('using the X annotation on a class', () => {
      it('calls the bridged decorator', () => {
        decoratedClassSpy = jest.fn(function () {
          return function MyClassDecorated(this: any, x: string, y: string) {
            this.x = x.toLocaleUpperCase();
            this.y = y.toLocaleUpperCase();
          };
        });
        @XClass('a', 'b')
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
      it('calls the bridged decorator', () => {
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

          @XMethod('a', 'b')
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
      it('calls the bridged decorator', () => {
        class MyClass {
          @XProperty('a', 'b')
          prop = 'x';
        }

        expect(propertyDecoratorSpy).toHaveBeenCalledWith('A', 'B');
        const [proto, propertyKey] = decoratedPropertySpy.mock.calls[0];
        expect(proto).toBeDefined();
        expect(propertyKey).toEqual('prop');
      });
    });

    describe('using the X annotation on a parameter', () => {
      it('calls the bridged decorator', () => {
        class MyClass {
          m(
            @XParameter('a', 'b')
            param: string,
          ) {}
        }

        expect(parameterDecoratorSpy).toHaveBeenCalledWith('A', 'B');
        const [proto, propertyKey, paramIndex] =
          decoratedParameterSpy.mock.calls[0];
        expect(proto).toBeDefined();
        expect(propertyKey).toEqual('m');
        expect(paramIndex).toEqual(0);
      });
    });
  });
});
