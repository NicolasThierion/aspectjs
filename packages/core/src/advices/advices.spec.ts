import {
  Annotation,
  AnnotationFactory,
  AnnotationType,
} from '@aspectjs/common';
import {
  AfterThrow,
  AfterThrowContext,
  Around,
  AroundContext,
  Aspect,
  JoinPoint,
  getWeaver,
  on,
} from '@aspectjs/core';

describe('registering multiple advices aspects', () => {
  describe('with advices that triggers on different annotations', () => {
    describe('calling an annotated method', () => {
      const af = new AnnotationFactory('test');
      let AAnnotation: Annotation<AnnotationType.ANY>;
      let BAnnotation: Annotation<AnnotationType.ANY>;

      let aroundAimpl = jest.fn();
      let afterThrowBimpl = jest.fn();
      let mImpl = jest.fn();

      beforeEach(() => {
        AAnnotation = af.create('AAnnotation');
        BAnnotation = af.create('BAnnotation');

        aroundAimpl = jest.fn(
          (context: AroundContext, joinpoint: JoinPoint, args: unknown[]) => {
            return joinpoint(...args);
          },
        );
        afterThrowBimpl = jest.fn(
          (context: AfterThrowContext, error: Error) => {
            throw error;
          },
        );
        mImpl = jest.fn();

        @Aspect()
        class AAspect {
          @Around(on.classes.withAnnotations(AAnnotation))
          @Around(on.methods.withAnnotations(AAnnotation))
          applyAroundA(
            context: AroundContext,
            joinpoint: JoinPoint,
            args: unknown[],
          ) {
            aroundAimpl(context, joinpoint, args);
          }
        }
        @Aspect()
        class BAspect {
          @AfterThrow(on.classes.withAnnotations(BAnnotation))
          @AfterThrow(on.methods.withAnnotations(BAnnotation))
          applyAfterThrowB(context: AfterThrowContext, error: Error) {
            afterThrowBimpl(context, error);
          }
        }

        getWeaver().enable(new AAspect(), new BAspect());
      });

      it('should call only the advices that matches the annotation', () => {
        @BAnnotation()
        class X {
          @BAnnotation()
          m() {
            mImpl();
          }
        }

        mImpl = jest.fn(() => {
          throw new Error('error');
        });

        expect(() => {
          new X().m();
        }).toThrow(new Error('error'));

        expect(aroundAimpl).not.toHaveBeenCalled();
        expect(afterThrowBimpl).toHaveBeenCalledTimes(1);
      });
    });
  });
});
