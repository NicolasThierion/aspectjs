import { configureReflectTestingContext } from '@aspectjs/common/testing';
import type { ReflectContext } from '../../reflect/reflect.context';
import type { Annotation } from '../annotation.types';
import { AnnotationFactory } from '../factory/annotation.factory';
import type { AnnotationTargetFactory } from '../target/annotation-target.factory';
import {
  AnnotationTrigger,
  AnnotationTriggerRegistry,
} from './annotation-trigger.registry';

describe('configureReflectContext()', () => {
  let context!: ReflectContext;
  beforeEach(() => {
    context = configureReflectTestingContext();
  });

  it('has a "annotationTriggerRegistry" provider', () => {
    expect(context.has('annotationTriggerRegistry')).toBeTruthy();
    expect(context.get('annotationTriggerRegistry')).toBeInstanceOf(
      AnnotationTriggerRegistry,
    );
  });
});

describe('AnnotationTriggerRegistry', () => {
  let context!: ReflectContext;
  let annotation: Annotation;
  let annotationFactory = new AnnotationFactory('test');
  let annotationTargetFactory: AnnotationTargetFactory;
  let annotationTriggerRegistry: AnnotationTriggerRegistry;
  beforeEach(() => {
    context = configureReflectTestingContext();
    annotation = annotationFactory.create();
    annotationTargetFactory = context.get('annotationTargetFactory');
    annotationTriggerRegistry = context.get('annotationTriggerRegistry');
  });

  describe('.add(<trigger>)', () => {
    let trigger: AnnotationTrigger;
    let applyAnnotation: () => void;
    beforeEach(() => {
      let Toto = class Toto {};

      trigger = {
        annotations: [annotation],
        fn: jest.fn(),
        target: annotationTargetFactory.of(Toto),
      };
      applyAnnotation = () => {
        Toto = annotation()(Toto);
      };
    });
    describe('when a class is annotated with an annotation', () => {
      describe('that matches <trigger.annotation>', () => {
        describe('and <trigger.target> matches that class', () => {
          beforeEach(() => {
            annotationTriggerRegistry.add(trigger);
          });

          it('calls <trigger.fn>', () => {
            expect(trigger.fn).not.toHaveBeenCalled();
            applyAnnotation();
            expect(trigger.fn).toHaveBeenCalledTimes(1);
          });
        });

        describe('but <trigger.target> does not match that class', () => {
          beforeEach(() => {
            trigger.target = annotationTargetFactory.of(class X {});
            annotationTriggerRegistry.add(trigger);
          });

          it('does not call <trigger.fn>', () => {
            expect(trigger.fn).not.toHaveBeenCalled();
            applyAnnotation();
            expect(trigger.fn).not.toHaveBeenCalled();
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
  });
});
