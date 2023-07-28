/* eslint-disable no-prototype-builtins */
import { configureTesting } from '@aspectjs/common/testing';
import { AnnotationType } from '../annotation.types';
import { AnnotationsReflectModule } from '../context/annotations.context.global';
import { AnnotationTargetFactory } from './annotation-target.factory';

describe('AnnotationTargetFactory', () => {
  class X {
    prop?: string = 'propValue';
    method(..._args: any[]) {}
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let targetFactory: AnnotationTargetFactory;
  beforeEach(() => {
    targetFactory = configureTesting()
      .addModules(AnnotationsReflectModule)
      .get(AnnotationTargetFactory);
  });
  describe('.of(<CLASS>)', () => {
    it('.type === AnnotationType.CLASS', () => {
      const target = targetFactory.of(X);
      expect(target.type).toBe(AnnotationType.CLASS);
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
  describe('.of(Prototype<CLASS>)', () => {
    it('.type === AnnotationType.CLASS', () => {
      const target = targetFactory.of(X.prototype);
      expect(target.type).toBe(AnnotationType.CLASS);
    });

    it('.proto === Prototype<CLASS>', () => {
      const target = targetFactory.of(X.prototype);
      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <self>', () => {
      const target = targetFactory.of(X.prototype);
      expect(target.declaringClass).toBe(target);
    });

    it('.value is not defined', () => {
      const target = targetFactory.of(X.prototype);
      expect(target.hasOwnProperty('value')).toBe(false);
    });
  });
  describe('.of(x)', () => {
    it('.type === AnnotationType.CLASS', () => {
      const target = targetFactory.of(new X());
      expect(target.type).toBe(AnnotationType.CLASS);
    });

    it('.proto === Prototype<X>', () => {
      const target = targetFactory.of(new X());
      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <self>', () => {
      const target = targetFactory.of(new X());
      expect(target.declaringClass).toBe(target);
    });

    it('.value === x', () => {
      const x = new X();
      const target = targetFactory.of(x);
      expect(target.value).toBe(x);
    });
  });

  describe('.of(X, propertyKey)', () => {
    it('.type === AnnotationType.PROPERTY', () => {
      const target = targetFactory.of(new X(), 'prop');
      expect(target.type).toBe(AnnotationType.PROPERTY);
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

    it('.value === x', () => {
      const x = new X();
      const target = targetFactory.of(x, 'prop');
      expect(target.value).toBe(x.prop);
    });
  });
  describe('.of(<prototype>, propertyKey)', () => {
    it('.type === AnnotationType.PROPERTY', () => {
      const target = targetFactory.of(X.prototype, 'prop');
      expect(target.type).toBe(AnnotationType.PROPERTY);
    });

    it('.proto === Prototype<X>', () => {
      const target = targetFactory.of(X.prototype, 'prop');
      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <class target>', () => {
      const target = targetFactory.of(X.prototype, 'prop');
      expect(target.declaringClass).toBe(targetFactory.of(X.prototype));
    });

    it('.parent === <class target>', () => {
      const target = targetFactory.of(new X(), 'prop');
      expect(target.parent).toEqual(targetFactory.of(new X()));
    });

    it('.value === x', () => {
      const target = targetFactory.of(X.prototype, 'prop');
      expect(target.hasOwnProperty('value')).toBe(false);
    });
  });
  describe('.of(<object>, propertyKey)', () => {
    it('.type === AnnotationType.PROPERTY', () => {
      const target = targetFactory.of(new X(), 'prop');
      expect(target.type).toBe(AnnotationType.PROPERTY);
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

    it('.value === x', () => {
      const target = targetFactory.of(new X(), 'prop');
      expect(target.value).toEqual(new X().prop);
    });
  });

  describe('.of(<constructor>, methodName)', () => {
    it('.type === AnnotationType.METHOD', () => {
      const target = targetFactory.of(X, 'method');
      expect(target.type).toBe(AnnotationType.METHOD);
    });

    it('.proto === Prototype<X>', () => {
      const target = targetFactory.of(X, 'method');
      expect(target.proto).toBe(X.prototype);
    });

    it('.declaringClass === <class target>', () => {
      const target = targetFactory.of(X, 'method');
      expect(target.declaringClass).toBe(targetFactory.of(X.prototype));
    });

    it('.parent === <class target>', () => {
      const target = targetFactory.of(X, 'method');
      expect(target.parent).toBe(targetFactory.of(X));
    });

    it('.value === x', () => {
      const target = targetFactory.of(X, 'method');
      expect(target.hasOwnProperty('value')).toBe(false);
    });
  });
  describe('.of(<prototype>, <propertyKey>, <descriptor>)', () => {
    it('.type === AnnotationType.METHOD', () => {
      const target = targetFactory.of(
        X.prototype,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.type).toBe(AnnotationType.METHOD);
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
      expect(target.declaringClass).toBe(targetFactory.of(X.prototype));
    });

    it('.parent === <class target>', () => {
      const target = targetFactory.of(
        X.prototype,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.parent).toBe(targetFactory.of(X));
    });

    it('.value === x', () => {
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

    it('.value === x', () => {
      const x = new X();

      const target = targetFactory.of(
        x,
        'method',
        Object.getOwnPropertyDescriptor(X.prototype, 'method')!,
      );
      expect(target.value).toBe(x.method);
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
      expect(target.declaringClass).toBe(targetFactory.of(X.prototype));
    });

    it('.parent === <class target>', () => {
      const target = targetFactory.of(X, 'method', 1);
      expect(target.parent).toBe(targetFactory.of(X, 'method'));
    });
  });
});
