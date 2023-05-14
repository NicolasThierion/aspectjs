import { assert, ConstructorType, isObject } from '@aspectjs/common/utils';
import { AnnotationRef } from '../annotation-ref';
import { Annotation, TargetType } from '../annotation.types';
import type {
  AnnotationTarget,
  AnnotationTargetRef,
} from '../target/annotation-target';
import type { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { AnnotationContext } from './../annotation-context';
import { AnnotationSelectionFilter } from './annotation-selection-filter';

type ByAnnotationSet = {
  byClassTargetRef: Map<AnnotationTargetRef, AnnotationContext>;
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
  ): AnnotationContext[] {
    const annotationsInClass = decoratorTypes
      .map((t) => this.buckets[t])
      .flatMap((m) =>
        annotationRefs.length
          ? annotationRefs.map((ref) => m.get(AnnotationRef.of(ref)))
          : [...m.values()],
      )
      .filter((set) => !!set)
      .map((set) => set!.byClassTargetRef)
      .flatMap((map) =>
        classTargetRef ? map?.get(classTargetRef) ?? [] : [...map.values()],
      );

    if (propertyKey === undefined) {
      return annotationsInClass;
    }

    return annotationsInClass.filter(
      (a: AnnotationContext<TargetType.METHOD>) =>
        a.target.propertyKey === propertyKey,
    );
  }

  addAnnotation(ctxt: AnnotationContext) {
    const bucket = this.buckets[ctxt.target.type];
    assert(() => !!bucket);
    const byAnnotationSet = bucket.get(ctxt.annotation.ref) ?? {
      byClassTargetRef: new Map<AnnotationTargetRef, AnnotationContext>(),
    };

    byAnnotationSet.byClassTargetRef.set(ctxt.target.declaringClass.ref, ctxt);
    bucket.set(ctxt.annotation.ref, byAnnotationSet);
  }
}

interface AnnotationByTypeSelectionOptions {
  searchParents: boolean;
}
/**
 * @internal
 */
class AnnotationByTypeSelection<
  T extends TargetType = TargetType,
  X = unknown,
> {
  constructor(
    private readonly targetFactory: AnnotationTargetFactory,
    private readonly annotationSet: _AnnotationsSet,
    private readonly annotationsRefs: AnnotationRef[],
    private readonly decoratorTypes: T[],
    private readonly type?: ConstructorType<X>,
    private readonly propertyKey?: keyof X,
  ) {}

  find(options?: AnnotationByTypeSelectionOptions): AnnotationContext<T, X>[] {
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
  onMethod<X = any>(
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
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
  onProperty<X>(
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
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
  onArgs<X>(
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
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

  register(annotationContext: AnnotationContext) {
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
