import { Annotation, AnnotationFactory } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import {
  AfterThrow,
  AfterThrowContext,
  Around,
  AroundContext,
  Aspect,
  Before,
  JoinPoint,
  getWeaver,
  on,
} from '@aspectjs/core';

describe('registering multiple advices', () => {
  describe('with advices that triggers on different annotations', () => {
    describe('calling an annotated method', () => {
      const af = new AnnotationFactory('test');
      let AAnnotation: Annotation;
      let BAnnotation: Annotation;
      let CAnnotation: Annotation;

      let aroundAimpl = jest.fn();
      let afterThrowBimpl = jest.fn();
      let beforeCimpl = jest.fn();
      let mImpl = jest.fn();

      beforeEach(() => {
        AAnnotation = af.create('AAnnotation');
        BAnnotation = af.create('BAnnotation');
        CAnnotation = af.create('CAnnotation');
        configureTesting();

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
        beforeCimpl = jest.fn();

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

        @Aspect()
        class CAspect {
          @Before(on.parameters.withAnnotations(CAnnotation))
          applyBeforeC(context: AfterThrowContext, error: Error) {
            beforeCimpl(context, error);
          }
        }

        getWeaver().enable(new AAspect(), new BAspect(), new CAspect());
      });

      it('calls the advices that matches the annotation', () => {
        @BAnnotation()
        class X {
          @AAnnotation()
          @BAnnotation()
          m(@CAnnotation() _arg: string) {
            mImpl();
          }
        }

        mImpl = jest.fn(() => {
          throw new Error('error');
        });

        expect(() => {
          new X().m('arg');
        }).toThrow(new Error('error'));

        expect(aroundAimpl).toHaveBeenCalled();
        expect(afterThrowBimpl).toHaveBeenCalledTimes(1);
        expect(beforeCimpl).toHaveBeenCalledTimes(1);
      });

      it('calls only the advices that matches the annotation', () => {
        @BAnnotation()
        class X {
          @BAnnotation()
          m(@CAnnotation() _arg: string) {
            mImpl();
          }
        }

        mImpl = jest.fn(() => {
          throw new Error('error');
        });

        expect(() => {
          new X().m('arg');
        }).toThrow(new Error('error'));

        expect(aroundAimpl).not.toHaveBeenCalled();
        expect(afterThrowBimpl).toHaveBeenCalledTimes(1);
        expect(beforeCimpl).toHaveBeenCalledTimes(1);
      });
    });
  });
});
