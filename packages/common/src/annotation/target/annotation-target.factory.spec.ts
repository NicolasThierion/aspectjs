/* eslint-disable no-prototype-builtins */
import { configureTesting } from '@aspectjs/common/testing';
import { AnnotationType } from '../annotation.types';
import { AnnotationTargetFactory } from './annotation-target.factory';

// eslint-disable  @typescript-eslint/no-unused-vars
describe('AnnotationTargetFactory', () => {
  class X {
    static prop?: string = 'staticProp';
    static method() {}

    prop?: string = 'propValue';
    method(..._args: any[]) {}
  }
  let targetFactory: AnnotationTargetFactory;
  beforeEach(() => {
    targetFactory = configureTesting().get(AnnotationTargetFactory);
  });
  describe('.of(<CLASS>)', () => {
    it('.type === AnnotationType.CLASS', () => {
      const target = targetFactory.of(X);
      expect(target.type).toBe(AnnotationType.CLASS);
    });

    it('.static === false', () => {
      const target = targetFactory.of(X);
      expect(target.static).toBe(false);
    });

    it('.proto === Prototype<CLASS>', () => {
      const target = targetFactory.of(X);
      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <self>', () => {
      const target = targetFactory.of(X);
      expect(target.declaringClass).toBe(target);
    });
  });
  // xdescribe('.of(Prototype<CLASS>)', () => {
  //   it('.type === AnnotationType.CLASS', () => {
  //     const target = targetFactory.of(X.prototype);
  //     expect(target.type).toBe(AnnotationType.CLASS);
  //   });

  //   it('.static === false', () => {
  //     const target = targetFactory.of(X.prototype);
  //     expect(target.static).toBe(false);
  //   });

  //   it('.proto === Prototype<CLASS>', () => {
  //     const target = targetFactory.of(X.prototype);
  //     expect(target.proto).toBe(X.prototype);
  //   });

  //   it('.declaringClass === <self>', () => {
  //     const target = targetFactory.of(X.prototype);
  //     expect(target.declaringClass).toBe(target);
  //   });

  //   it('.eval() is not defined', () => {
  //     const target = targetFactory.of(X.prototype);
  //     expect(target.hasOwnProperty('value')).toBe(false);
  //   });
  // });
  describe('.of(x)', () => {
    it('.type === AnnotationType.CLASS', () => {
      const target = targetFactory.of(new X());
      expect(target.type).toBe(AnnotationType.CLASS);
    });

    it('.static === false', () => {
      const target = targetFactory.of(new X());
      expect(target.static).toBe(false);
    });

    it('.proto === Prototype<X>', () => {
      const target = targetFactory.of(new X());
      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <self>', () => {
      const target = targetFactory.of(new X());
      expect(target.declaringClass).toBe(target);
    });

    it('.eval() === x', () => {
      const x = new X();
      const target = targetFactory.of(x);
      expect(target.eval()).toBe(x);
    });
  });

  describe('.of(new X(), propertyKey)', () => {
    it('.type === AnnotationType.PROPERTY', () => {
      const target = targetFactory.of(new X(), 'prop');
      expect(target.type).toBe(AnnotationType.PROPERTY);
    });

    it('.static === false', () => {
      const target = targetFactory.of(new X(), 'method');
      expect(target.static).toBe(false);
    });

    it('.proto === Prototype<X>', () => {
      const target = targetFactory.of(new X(), 'prop');
      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <class target>', () => {
      const target = targetFactory.of(new X(), 'prop');
      expect(target.declaringClass).toEqual(targetFactory.of(new X()));
    });

    it('.parent === <class target>', () => {
      const target = targetFactory.of(new X(), 'prop');
      expect(target.parent).toEqual(targetFactory.of(new X()));
    });

    it('.eval() === x', () => {
      const x = new X();
      const target = targetFactory.of(x, 'prop');
      expect(target.eval()).toBe(x.prop);
    });
  });
  describe('.of(X.prototype, propertyKey)', () => {
    it('.type === AnnotationType.PROPERTY', () => {
      const target = targetFactory.of(X.prototype, 'prop');
      expect(target.type).toBe(AnnotationType.PROPERTY);
    });

    it('.static === false', () => {
      const target = targetFactory.of(X.prototype, 'method');
      expect(target.static).toBe(false);
    });

    it('.proto === Prototype<X>', () => {
      const target = targetFactory.of(X.prototype, 'prop');
      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <class target>', () => {
      const target = targetFactory.of(X.prototype, 'prop');
      expect(target.declaringClass).toBe(targetFactory.of(X));
    });

    it('.parent === <class target>', () => {
      const target = targetFactory.of(X.prototype, 'prop');
      expect(target.parent).toEqual(targetFactory.of(X));
    });

    it('.eval() throws an error', () => {
      const target = targetFactory.of(X.prototype, 'prop');
      expect(() => target.eval()).toThrowError(
        'AnnotationTarget is not bound to a value',
      );
    });
    it('.descriptor === property descriptor', () => {
      const target = targetFactory.of(X.prototype, 'prop');
      expect(target.descriptor).toBe(
        Object.getOwnPropertyDescriptor(X.prototype, 'prop'),
      );
    });
  });

  describe('.of(X.prototype, methodName)', () => {
    it('.type === AnnotationType.METHOD', () => {
      const target = targetFactory.of(X.prototype, 'method');
      expect(target.type).toBe(AnnotationType.METHOD);
    });
    it('.static === false', () => {
      const target = targetFactory.of(X.prototype, 'method');
      expect(target.static).toBe(false);
    });

    it('.proto === Prototype<X>', () => {
      const target = targetFactory.of(X.prototype, 'method');
      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <class target>', () => {
      const target = targetFactory.of(X.prototype, 'method');
      expect(target.declaringClass).toBe(targetFactory.of(X));
    });

    it('.parent === <class target>', () => {
      const target = targetFactory.of(X.prototype, 'method');
      expect(target.parent).toBe(targetFactory.of(X));
    });

    it('.eval() throws an error', () => {
      const target = targetFactory.of(X.prototype, 'method');
      expect(() => target.eval()).toThrowError(
        'AnnotationTarget is not bound to a value',
      );
    });
    it('.descriptor === the property descriptor', () => {
      const target = targetFactory.of(X.prototype, 'method');
      expect(target.descriptor).toEqual(
        Object.getOwnPropertyDescriptor(X.prototype, 'method'),
      );
    });
  });

  describe('.of(X, methodName', () => {
    it('.static === true', () => {
      const target = targetFactory.of(X, 'method');
      expect(target.static).toBe(true);
    });
    it('.descriptor === the static property descriptor', () => {
      const target = targetFactory.of(X, 'method');
      expect(target.descriptor).toEqual(
        Object.getOwnPropertyDescriptor(X, 'method'),
      );
    });
  });
  describe('.of(X.prototype, <propertyKey>, <descriptor>)', () => {
    it('.type === AnnotationType.METHOD', () => {
      const target = targetFactory.of(
        X.prototype,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.type).toBe(AnnotationType.METHOD);
    });

    it('.static === false', () => {
      const target = targetFactory.of(X.prototype, 'method');
      expect(target.static).toBe(false);
    });

    it('.proto === Prototype<X>', () => {
      const target = targetFactory.of(
        X.prototype,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <class target>', () => {
      const target = targetFactory.of(
        X.prototype,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.declaringClass).toBe(targetFactory.of(X));
    });

    it('.parent === <class target>', () => {
      const target = targetFactory.of(
        X.prototype,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.parent).toBe(targetFactory.of(X));
    });

    it('.eval() === x', () => {
      const target = targetFactory.of(
        X.prototype,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.hasOwnProperty('value')).toBe(false);
    });
  });

  describe('.of(<object>, descriptor)', () => {
    it('.type === AnnotationType.METHOD', () => {
      const x = new X();
      const target = targetFactory.of(
        x,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.type).toBe(AnnotationType.METHOD);
    });

    it('.proto === Prototype<X>', () => {
      const x = new X();

      const target = targetFactory.of(
        x,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );

      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <class target>', () => {
      const x = new X();

      const target = targetFactory.of(
        x,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.declaringClass).toEqual(targetFactory.of(new X()));
    });

    it('.parent === <class target>', () => {
      const x = new X();
      const target = targetFactory.of(
        x,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.parent).toEqual(targetFactory.of(new X()));
    });

    it('.eval() === x', () => {
      const x = new X();

      const target = targetFactory.of(
        x,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.eval()).toBe(x.method);
    });
  });

  describe('.of(<constructor>, propertyKey, parameterIndex)', () => {
    it('.type === AnnotationType.PARAMETER', () => {
      const target = targetFactory.of(X, 'method', 1);
      expect(target.type).toBe(AnnotationType.PARAMETER);
    });

    it('.proto === Prototype<X>', () => {
      const target = targetFactory.of(X, 'method', 1);

      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <class target>', () => {
      const target = targetFactory.of(X, 'method', 1);
      expect(target.declaringClass).toBe(targetFactory.of(X));
    });

    it('.parent === <class target>', () => {
      const target = targetFactory.of(X, 'method', 1);
      expect(target.parent).toBe(targetFactory.of(X, 'method'));
    });
  });
});
