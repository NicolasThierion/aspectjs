import { AnnotationContext } from '../annotation-context';
import { AnnotationRef } from '../annotation-ref';
import { Annotation } from '../annotation.types';
import type { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { _AnnotationsSet } from './annotation-set';
import { AnnotationByTargetSelector } from './by-target-selector';

/**
 * Store all registered annotations
 */
export class AnnotationRegistry {
  private readonly annotationSet = new _AnnotationsSet();
  constructor(private targetFactory: AnnotationTargetFactory) {}

  register(annotationContext: AnnotationContext) {
    this.annotationSet.addAnnotation(annotationContext);
  }

  select(
    ...annotations: (
      | Pick<AnnotationRef, 'groupId' | 'name'>
      | Annotation
      | string
    )[]
  ): AnnotationByTargetSelector {
    const annotationsFilter = annotations.length
      ? new Set(
          annotations.filter((a) => a !== undefined).map(AnnotationRef.of),
        )
      : undefined;

    return new AnnotationByTargetSelector(
      this.targetFactory,
      this.annotationSet,
      annotationsFilter,
    );
  }
}
