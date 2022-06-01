import { configureReflectTestingContext } from '@aspectjs/common/testing';
import type { ReflectContext } from '../../reflect/reflect.context';
import type { Annotation, AnnotationType } from '../annotation.types';
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
  let annotation: Annotation<AnnotationType.ANY>;
  const annotationFactory = new AnnotationFactory('test');
  let annotationTargetFactory: AnnotationTargetFactory;
  let annotationTriggerRegistry: AnnotationTriggerRegistry;
  const annotationArgs = 'annotationArgs';
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
        Toto = annotation(annotationArgs)(Toto);
      };
    });
    describe('called before @SomeAnnotation() class SomeClass{}', () => {
      describe('when <trigger.annotations> contains "SomeAnnotation"', () => {
        describe('and <trigger.target> matches that class', () => {
          beforeEach(() => {
            annotationTriggerRegistry.add(trigger);
          });

          it('calls <trigger.fn>', () => {
            expect(trigger.fn).not.toHaveBeenCalled();
            applyAnnotation();
            expect(trigger.fn).toHaveBeenCalledTimes(1);
            expect(trigger.fn).toHaveBeenCalledWith(annotation, [
              annotationArgs,
            ]);
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
    describe('called after @SomeAnnotation() class SomeClass{}', () => {
      describe('when <trigger.annotations> contains "SomeAnnotation"', () => {
        describe('and <trigger.target> matches that class', () => {
          beforeEach(() => {
            applyAnnotation();
            annotationTriggerRegistry.add(trigger);
          });

          it('calls <trigger.fn>', () => {
            expect(trigger.fn).toHaveBeenCalledTimes(1);
            expect(trigger.fn).toHaveBeenCalledWith(annotation, [
              annotationArgs,
            ]);
          });
        });
      });
    });
  });
});
