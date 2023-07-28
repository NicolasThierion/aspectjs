import { assert } from '@aspectjs/common/utils';
import { AnnotationContext } from '../annotation-context';
import { AnnotationRef } from '../annotation-ref';
import { AnnotationType } from '../annotation.types';
import { AnnotationTargetRef } from '../target/annotation-target';

type ByAnnotationSet = {
  byClassTargetRef: Map<AnnotationTargetRef, AnnotationContext[]>;
}; /**

 * @internal
 */
export class _AnnotationsSet {
  private buckets: {
    [k in AnnotationType]: Map<AnnotationRef, ByAnnotationSet>;
  } = {
    [AnnotationType.CLASS]: new Map(),
    [AnnotationType.PROPERTY]: new Map(),
    [AnnotationType.METHOD]: new Map(),
    [AnnotationType.PARAMETER]: new Map(),
  };

  getAnnotations(
    decoratorTypes: AnnotationType[],
    annotationRefs?: Set<AnnotationRef>,
    classTargetRef?: AnnotationTargetRef | undefined,
    propertyKey?: string | number | symbol | undefined,
  ): AnnotationContext[] {
    return decoratorTypes.flatMap((t) => {
      const _propertyKey = t === AnnotationType.CLASS ? undefined : propertyKey;
      const m = this.buckets[t];
      return (
        annotationRefs
          ? [...annotationRefs].map((ref) => m.get(AnnotationRef.of(ref)))
          : [...m.values()]
      )
        .filter((set) => !!set)
        .map((set) => set!.byClassTargetRef)
        .flatMap((byClassTargetRef) => {
          return classTargetRef
            ? byClassTargetRef?.get(classTargetRef) ?? []
            : [...byClassTargetRef.values()].flat();
        })
        .filter(
          (annotation) =>
            // keep annotations if search for target = class
            // keep annotations if does not search for specific property
            _propertyKey === undefined ||
            (annotation as AnnotationContext<AnnotationType.METHOD>).target
              .propertyKey === propertyKey,
        );
    });
  }

  addAnnotation(ctxt: AnnotationContext) {
    const bucket = this.buckets[ctxt.target.type];
    assert(() => !!bucket);
    const byAnnotationSet = bucket.get(ctxt.ref) ?? {
      byClassTargetRef: new Map<AnnotationTargetRef, AnnotationContext[]>(),
    };

    const contexts =
      byAnnotationSet.byClassTargetRef.get(ctxt.target.declaringClass.ref) ??
      [];

    contexts.push(ctxt);
    byAnnotationSet.byClassTargetRef.set(
      ctxt.target.declaringClass.ref,
      contexts,
    );
    bucket.set(ctxt.ref, byAnnotationSet);
  }
}
