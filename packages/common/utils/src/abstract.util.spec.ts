import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { _defuseAbstract, abstract } from './abstract.util';

describe('abstract() helper', () => {
  let MethodAnnotation: any;
  beforeEach(() => {
    const af = new AnnotationFactory('test');
    MethodAnnotation = af.create(AnnotationType.METHOD, 'ClassAnnotation');
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

    describe('when used for anything other than a return value', () => {
      it('throws an error', () => {
        class X {
          @MethodAnnotation()
          method() {
            abstract<string>();
            return 'test';
          }
        }
        expect(() => _defuseAbstract(() => new X().method())).toThrow(
          new Error(
            '"abstract()" placeholder should only be used as a return value.',
          ),
        );
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
