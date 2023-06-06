import { assert, ConstructorType, isObject } from '@aspectjs/common/utils';
import { AnnotationContext } from '../annotation-context';
import { AnnotationRef } from '../annotation-ref';
import {
  Annotation,
  AnnotationStub,
  AnnotationType,
  TargetType,
} from '../annotation.types';
import type {
  AnnotationTarget,
  AnnotationTargetRef,
} from '../target/annotation-target';
import type { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { AnnotationSelectionFilter } from './annotation-selection-filter';

type ByAnnotationSet = {
  byClassTargetRef: Map<AnnotationTargetRef, AnnotationContext[]>;
};

/**
 * @internal
 */
class _AnnotationsSet {
  private buckets: {
    [k in TargetType]: Map<AnnotationRef, ByAnnotationSet>;
  } = {
    [TargetType.CLASS]: new Map(),
    [TargetType.PROPERTY]: new Map(),
    [TargetType.METHOD]: new Map(),
    [TargetType.PARAMETER]: new Map(),
  };

  getAnnotations(
    decoratorTypes: TargetType[],
    annotationRefs?: Set<AnnotationRef>,
    classTargetRef?: AnnotationTargetRef | undefined,
    propertyKey?: string | number | symbol | undefined,
  ): AnnotationContext[] {
    return decoratorTypes.flatMap((t) => {
      const _propertyKey = t === TargetType.CLASS ? undefined : propertyKey;
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
            (annotation as AnnotationContext<TargetType.METHOD>).target
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

interface AnnotationsByTypeSelectionOptions {
  searchParents: boolean;
}
/**
 * @internal
 */
export class AnnotationsByTypeSelection<
  T extends TargetType = TargetType,
  X = unknown,
  P extends keyof X = any,
  S extends AnnotationStub = AnnotationStub,
> {
  constructor(
    private readonly targetFactory: AnnotationTargetFactory,
    private readonly annotationSet: _AnnotationsSet,
    private readonly annotationsRefs: Set<AnnotationRef> | undefined,
    private readonly decoratorTypes: T[],
    private readonly type?: ConstructorType<X>,
    private readonly propertyKey?: P,
  ) {}
  filter<S2 extends AnnotationStub>(
    annotation: Annotation<AnnotationType, S2>,
  ): AnnotationsByTypeSelection<T, X, P, S2>;
  filter(...annotations: Annotation[]): AnnotationsByTypeSelection<T, X, P>;
  filter(...annotations: Annotation[]): AnnotationsByTypeSelection<T, X, P> {
    let annotationRefs = this.annotationsRefs;
    if (annotations.length) {
      if (!annotationRefs) {
        annotationRefs = new Set(annotations.map(AnnotationRef.of));
      } else {
        annotationRefs = new Set(
          annotations
            .map(AnnotationRef.of)
            .filter((a) => annotationRefs!.has(a)),
        );
      }
    }

    return new AnnotationsByTypeSelection(
      this.targetFactory,
      this.annotationSet,
      annotationRefs,
      this.decoratorTypes,
      this.type,
      this.propertyKey,
    );
    // return new AnnotationSelection(
    //   this.targetFactory,
    //   this.annotationSet,
    //   annotations.map(AnnotationRef.of),
    // );
  }

  find(
    options?: AnnotationsByTypeSelectionOptions,
  ): AnnotationContext<T, X, S>[] {
    if (!this.type) {
      assert(!options?.searchParents);

      return this.annotationSet.getAnnotations(
        this.decoratorTypes,
        this.annotationsRefs,
        undefined,
        this.propertyKey,
      ) as AnnotationContext<T, X>[];
    }
    // search annotations on given type
    const classTarget = this.targetFactory.of(this.type);

    assert(!!classTarget);
    if (!classTarget) {
      return [];
    }

    // search extends the search to parent types ?
    const classTargets = options?.searchParents
      ? [classTarget, ...getAncestors(classTarget)]
      : [classTarget];

    return classTargets
      .map((target) => target.ref)
      .flatMap((ref) =>
        this.annotationSet.getAnnotations(
          this.decoratorTypes,
          this.annotationsRefs,
          ref,
          this.propertyKey,
        ),
      ) as AnnotationContext<T, X>[];
  }
}

/**
 * Selects annotations based on their type or target.
 */
export class AnnotationsSelection {
  constructor(
    private readonly targetFactory: AnnotationTargetFactory,
    private readonly annotationSet: _AnnotationsSet,
    private readonly annotationsRefs: Set<AnnotationRef> | undefined,
  ) {}

  all<X = unknown>(
    type?: ConstructorType<X>,
  ): AnnotationsByTypeSelection<TargetType, X> {
    return new AnnotationsByTypeSelection<TargetType, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      [
        TargetType.CLASS,
        TargetType.METHOD,
        TargetType.PROPERTY,
        TargetType.PARAMETER,
      ],
      type,
    );
  }
  onClass<X = unknown>(
    type?: ConstructorType<X>,
  ): AnnotationsByTypeSelection<TargetType.CLASS, X> {
    return new AnnotationsByTypeSelection<TargetType.CLASS, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      [TargetType.CLASS],
      type,
    );
  }
  onMethod<X = any, K extends keyof X = keyof X>(
    type?: ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<TargetType.METHOD, X> {
    return new AnnotationsByTypeSelection<TargetType.METHOD, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      [TargetType.METHOD],
      type,
      propertyKey,
    );
  }
  onProperty<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<TargetType.PROPERTY, X> {
    return new AnnotationsByTypeSelection<TargetType.PROPERTY, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      [TargetType.PROPERTY],
      type,
      propertyKey,
    );
  }
  onArgs<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<TargetType.PARAMETER, X> {
    return new AnnotationsByTypeSelection<TargetType.PARAMETER, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      [TargetType.PARAMETER],
      type,
      propertyKey,
    );
  }

  on<X>(
    filter: AnnotationSelectionFilter,
  ): AnnotationsByTypeSelection<TargetType, X> {
    const { target, types } = filter;
    assert(isObject(target));

    return new AnnotationsByTypeSelection<TargetType, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      types ??
        (Object.values(TargetType).filter(
          (x: any) => !isNaN(x),
        ) as TargetType[]),
      target.proto?.constructor,
      (target as AnnotationTarget<TargetType.METHOD>).propertyKey as any,
    );
  }
}

/**
 * Store all registered annotations
 */
export class AnnotationRegistry {
  private readonly annotationSet = new _AnnotationsSet();
  constructor(private targetFactory: AnnotationTargetFactory) {}

  register(annotationContext: AnnotationContext) {
    this.annotationSet.addAnnotation(annotationContext);
  }
  select(...annotations: (AnnotationRef | Annotation)[]): AnnotationsSelection {
    const annotationsFilter = annotations.length
      ? new Set(annotations.map(AnnotationRef.of))
      : undefined;

    return new AnnotationsSelection(
      this.targetFactory,
      this.annotationSet,
      annotationsFilter,
    );
  }
}

function getAncestors<T extends TargetType>(
  target: AnnotationTarget<T, any>,
): Array<AnnotationTarget<T, any>> {
  if (!target.parent) {
    return [];
  }
  return [
    target.parent as AnnotationTarget<T, any>,
    ...getAncestors<T>(target.parent as AnnotationTarget<T, any>),
  ];
}
