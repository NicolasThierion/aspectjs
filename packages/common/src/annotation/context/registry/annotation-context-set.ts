import { assert } from '@aspectjs/common/utils';
import { AnnotationContext } from '../../annotation-context';
import { AnnotationRef } from '../../annotation-ref';
import { AnnotationKind } from '../../annotation.types';
import { AnnotationTargetRef } from '../../target/annotation-target';

type ByAnnotationSet = {
  byClassTargetRef: Map<AnnotationTargetRef, AnnotationContext[]>;
}; /**

 * @internal
 */
export class _AnnotationContextSet {
  private buckets: {
    [k in AnnotationKind]: Map<AnnotationRef, ByAnnotationSet>;
  } = {
    [AnnotationKind.CLASS]: new Map(),
    [AnnotationKind.PROPERTY]: new Map(),
    [AnnotationKind.METHOD]: new Map(),
    [AnnotationKind.PARAMETER]: new Map(),
  };

  getAnnotations(
    decoratorTypes: AnnotationKind[],
    annotationRefs?: Set<AnnotationRef>,
    classTargetRef?: AnnotationTargetRef | undefined,
    propertyKey?: string | number | symbol | undefined,
  ): AnnotationContext[] {
    return decoratorTypes.flatMap((t) => {
      const _propertyKey = t === AnnotationKind.CLASS ? undefined : propertyKey;
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
            (annotation as AnnotationContext<AnnotationKind.METHOD>).target
              .propertyKey === propertyKey,
        );
    });
  }

  addAnnotation(ctxt: AnnotationContext) {
    const bucket = this.buckets[ctxt.target.kind];
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
