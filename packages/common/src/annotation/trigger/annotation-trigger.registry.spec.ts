import { configureTesting } from '@aspectjs/common/testing';
import type { ReflectContext } from '../../reflect/reflect.context';
import { AnnotationContext } from '../annotation-context';
import { Annotation, AnnotationType, TargetType } from '../annotation.types';
import { annotationsContext } from '../context/annotations.context.global';
import { AnnotationFactory } from '../factory/annotation.factory';
import type { AnnotationTarget } from '../target/annotation-target';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { AnnotationTriggerRegistry } from './annotation-trigger.registry';
import type { AnnotationTrigger } from './annotation-trigger.type';

describe('AnnotationTriggerRegistry', () => {
  let context!: ReflectContext;
  let annotation: Annotation<AnnotationType.ANY>;
  const annotationFactory = new AnnotationFactory('test');
  let annotationTargetFactory: AnnotationTargetFactory;
  let annotationTriggerRegistry: AnnotationTriggerRegistry;
  const annotationArgs = ['annotationArgs'];
  let fooTarget: AnnotationTarget;
  let barTarget: AnnotationTarget;
  beforeEach(() => {
    context = configureTesting(annotationsContext());
    annotation = annotationFactory.create();
    annotationTargetFactory = context.get(AnnotationTargetFactory);
    annotationTriggerRegistry = context.get(AnnotationTriggerRegistry);
  });

  describe('.add(<trigger>)', () => {
    let trigger: AnnotationTrigger;
    let applyAnnotation: () => void;
    beforeEach(() => {
      let Foo = class Foo {};
      let Bar = class Bar {};

      fooTarget = annotationTargetFactory.of(Foo);
      barTarget = annotationTargetFactory.of(Foo);
      trigger = {
        annotations: [annotation],
        fn: () => {},
        targets: [fooTarget],
      };
      jest.spyOn(trigger, 'fn');
      applyAnnotation = () => {
        Foo = annotation(...annotationArgs)(Foo);
        Bar = annotation(...annotationArgs)(Bar);
      };
    });
    describe('when called before @SomeAnnotation() class SomeClass{}', () => {
      describe('and <trigger.annotations> contains "SomeAnnotation"', () => {
        describe('and <trigger.targets> matches that class', () => {
          beforeEach(() => {
            annotationTriggerRegistry.add(trigger);
          });

          it('calls <trigger.fn>', () => {
            expect(trigger.fn).not.toHaveBeenCalled();
            applyAnnotation();
            expect(trigger.fn).toHaveBeenCalledTimes(1);
            expect(trigger.fn).toHaveBeenCalledWith(
              new AnnotationContext(annotation, annotationArgs, fooTarget),
            );
          });
        });

        describe('but <trigger.targets> does not match that class', () => {
          beforeEach(() => {
            trigger.targets = [annotationTargetFactory.of(class X {})];
            annotationTriggerRegistry.add(trigger);
          });

          it('does not call <trigger.fn>', () => {
            expect(trigger.fn).not.toHaveBeenCalled();
            applyAnnotation();
            expect(trigger.fn).not.toHaveBeenCalled();
          });
        });
        describe('and <trigger.targets> is empty', () => {
          beforeEach(() => {
            trigger.targets = [];
            annotationTriggerRegistry.add(trigger);
          });

          it('does not call <trigger.fn> ', () => {
            applyAnnotation();
            expect(trigger.fn).not.toHaveBeenCalled();
          });
        });
        describe('and <trigger.targets> contains TargetType.CLASS', () => {
          beforeEach(() => {
            trigger.targets = [TargetType.CLASS];
            annotationTriggerRegistry.add(trigger);
          });

          it('calls <trigger.fn> ', () => {
            expect(trigger.fn).not.toHaveBeenCalled();
            applyAnnotation();
            expect(trigger.fn).toHaveBeenCalledTimes(2);
            expect(trigger.fn).toHaveBeenCalledWith(
              new AnnotationContext(annotation, annotationArgs, fooTarget),
            );
            expect(trigger.fn).toHaveBeenCalledWith(
              new AnnotationContext(annotation, annotationArgs, barTarget),
            );
          });
        });
      });

      describe('that does not match <trigger.annotation>', () => {
        beforeEach(() => {
          trigger.annotations = [annotationFactory.create()];
          annotationTriggerRegistry.add(trigger);
        });
        it('does not call <trigger.fn>', () => {
          expect(trigger.fn).not.toHaveBeenCalled();
          applyAnnotation();
          expect(trigger.fn).not.toHaveBeenCalled();
        });
      });
    });
    describe('called after @SomeAnnotation() class SomeClass{}', () => {
      describe('when <trigger.annotations> contains "SomeAnnotation"', () => {
        describe('and <trigger.targets> matches that class', () => {
          beforeEach(() => {
            applyAnnotation();
          });

          it('calls <trigger.fn>', () => {
            annotationTriggerRegistry.add(trigger);
            expect(trigger.fn).toHaveBeenCalledTimes(1);
            expect(trigger.fn).toHaveBeenCalledWith(
              new AnnotationContext(annotation, annotationArgs, fooTarget),
            );
          });
        });
      });
    });
  });
});
