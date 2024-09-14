import { configureTesting } from '@aspectjs/common/testing';
import { AnnotationKind } from '../annotation/annotation.types';
import { AnnotationFactory } from '../annotation/factory/annotation.factory';
import { _defuseAbstract, abstract } from './abstract.type';

describe('abstract() helper', () => {
  let MethodAnnotation: any;
  beforeEach(() => {
    configureTesting();
    const af = new AnnotationFactory('test');
    MethodAnnotation = af.create(AnnotationKind.METHOD, 'ClassAnnotation');
  });

  it('should throw an error when called', () => {
    expect(() => abstract<string>()).toThrow();
  });

  describe(`within ${_defuseAbstract.name}`, () => {
    describe('when used as a return value', () => {
      it('does not throw an error', () => {
        class X {
          @MethodAnnotation()
          method() {
            return abstract<string>();
          }
        }
        expect(() => _defuseAbstract(() => new X().method())).not.toThrow();
      });
    });

    describe('when used more than once', () => {
      it('throws an error', () => {
        class X {
          @MethodAnnotation()
          method() {
            abstract<string>();
            return abstract<string>();
          }
        }
        expect(() => _defuseAbstract(() => new X().method())).toThrow(
          new Error(
            '"abstract()" placeholder should only be used as a return value.',
          ),
        );
      });
    });
  });
});
