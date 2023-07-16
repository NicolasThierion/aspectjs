import { _setReflectContext, AnnotationFactory } from '@aspectjs/common';
import { ReflectTestingContext } from '@aspectjs/common/testing';
import { Aspect, Before, getWeaver, on } from '@aspectjs/core';

describe('@Before property advice', () => {
  const af = new AnnotationFactory('test');

  beforeEach(() => {
    const context = _setReflectContext(new ReflectTestingContext());
  });
  describe('when the property is declared before enabling the weaver', () => {
    it('calls the advice before the property is get', () => {
      const EarlyAnnotation = af.create(function EarlyAnnotation() {});

      class A {
        @EarlyAnnotation()
        prop = 'p';
      }

      const advice = jest.fn(() => {});
      @Aspect()
      class EarlyAnnotationAspect {
        @Before(on.properties.withAnnotations(EarlyAnnotation))
        advice() {
          advice();
        }
      }
      const earlyAnnotationAspect = new EarlyAnnotationAspect();
      getWeaver().enable(earlyAnnotationAspect);

      new A().prop;

      expect(advice).toHaveBeenCalled();
      console.log(advice.mock.calls[0]);
    });
  });
});
