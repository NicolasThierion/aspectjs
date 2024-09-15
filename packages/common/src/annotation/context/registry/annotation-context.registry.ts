import { AnnotationContext } from '../../annotation-context';
import { AnnotationRef } from '../../annotation-ref';
import { Annotation } from '../../annotation.types';
import type { AnnotationTargetFactory } from '../../target/annotation-target.factory';
import { _AnnotationContextSet } from './annotation-context-set';
import { AnnotationByTargetSelector } from './by-target-selector';

/**
 * Store all registered annotations
 */
export class AnnotationContextRegistry {
  private readonly annotationSet = new _AnnotationContextSet();
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
