import { assert, ConstructorType, isObject } from '@aspectjs/common/utils';
import { AnnotationRef } from '../annotation-ref';
import { Annotation, TargetType } from '../annotation.types';
import type {
  AnnotationTarget,
  AnnotationTargetRef,
} from '../target/annotation-target';
import type { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { BindableAnnotationContext } from './../annotation-context';
import { AnnotationSelectionFilter } from './annotation-selection-filter';

type ByAnnotationSet = {
  byClassTargetRef: Map<AnnotationTargetRef, BindableAnnotationContext[]>;
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
    annotationRefs: AnnotationRef[],
    classTargetRef?: AnnotationTargetRef | undefined,
    propertyKey?: string | number | symbol | undefined,
  ): BindableAnnotationContext[] {
    const annotationsInClass = decoratorTypes
      .map((t) => this.buckets[t])
      .flatMap((m) =>
        annotationRefs.length
          ? annotationRefs.map((ref) => m.get(AnnotationRef.of(ref)))
          : [...m.values()],
      )
      .filter((set) => !!set)
      .map((set) => set!.byClassTargetRef)
      .flatMap((byClassTargetRef) => {
        return classTargetRef
          ? byClassTargetRef?.get(classTargetRef) ?? []
          : [...byClassTargetRef.values()].flat();
      });

    if (propertyKey === undefined) {
      return annotationsInClass;
    }

    return annotationsInClass.filter(
      (a: BindableAnnotationContext<TargetType.METHOD>) =>
        a.target.propertyKey === propertyKey,
    );
  }

  addAnnotation(ctxt: BindableAnnotationContext) {
    const bucket = this.buckets[ctxt.target.type];
    assert(() => !!bucket);
    const byAnnotationSet = bucket.get(ctxt.ref) ?? {
      byClassTargetRef: new Map<
        AnnotationTargetRef,
        BindableAnnotationContext[]
      >(),
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

interface AnnotationByTypeSelectionOptions {
  searchParents: boolean;
}
/**
 * @internal
 */
export class AnnotationByTypeSelection<
  T extends TargetType = TargetType,
  X = unknown,
  P extends keyof X = any,
> {
  constructor(
    private readonly targetFactory: AnnotationTargetFactory,
    private readonly annotationSet: _AnnotationsSet,
    private readonly annotationsRefs: AnnotationRef[],
    private readonly decoratorTypes: T[],
    private readonly type?: ConstructorType<X>,
    private readonly propertyKey?: P,
  ) {}

  find(
    options?: AnnotationByTypeSelectionOptions,
  ): BindableAnnotationContext<T, X>[] {
    if (!this.type) {
      assert(!options?.searchParents);

      return this.annotationSet.getAnnotations(
        this.decoratorTypes,
        this.annotationsRefs,
        undefined,
        this.propertyKey,
      ) as BindableAnnotationContext<T, X>[];
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
      ) as BindableAnnotationContext<T, X>[];
  }
}

export class AnnotationSelection {
  constructor(
    private readonly targetFactory: AnnotationTargetFactory,
    private readonly annotationSet: _AnnotationsSet,
    private readonly annotationsRefs: AnnotationRef[],
  ) {}

  all<X = unknown>(
    type?: ConstructorType<X>,
  ): AnnotationByTypeSelection<TargetType, X> {
    return new AnnotationByTypeSelection<TargetType, X>(
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
  ): AnnotationByTypeSelection<TargetType.CLASS, X> {
    return new AnnotationByTypeSelection<TargetType.CLASS, X>(
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
  ): AnnotationByTypeSelection<TargetType.METHOD, X> {
    return new AnnotationByTypeSelection<TargetType.METHOD, X>(
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
  ): AnnotationByTypeSelection<TargetType.PROPERTY, X> {
    return new AnnotationByTypeSelection<TargetType.PROPERTY, X>(
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
  ): AnnotationByTypeSelection<TargetType.PARAMETER, X> {
    return new AnnotationByTypeSelection<TargetType.PARAMETER, X>(
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
  ): AnnotationByTypeSelection<TargetType, X> {
    const { target, types } = filter;
    assert(isObject(target));

    return new AnnotationByTypeSelection<TargetType, X>(
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

  register(annotationContext: BindableAnnotationContext) {
    this.annotationSet.addAnnotation(annotationContext);
  }
  select(...annotations: (AnnotationRef | Annotation)[]): AnnotationSelection {
    return new AnnotationSelection(
      this.targetFactory,
      this.annotationSet,
      annotations.map(AnnotationRef.of),
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
