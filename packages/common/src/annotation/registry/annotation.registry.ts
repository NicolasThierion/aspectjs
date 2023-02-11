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

export class AnnotationSelector {
  constructor(
    private readonly targetFactory: AnnotationTargetFactory,
    private readonly annotationSet: _AnnotationsSet,
    private readonly annotationsRefs: AnnotationRef[],
  ) {}

  all<X = unknown>(type?: ConstructorType<X>): AnnotationContext[] {
    return this._find(
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
    searchParent = false,
  ): AnnotationContext<TargetType.CLASS>[] {
    return this._find([TargetType.CLASS], type, undefined, searchParent);
  }
  onMethod<X = any>(
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
    searchParent = false,
  ): AnnotationContext<TargetType.METHOD>[] {
    return this._find([TargetType.METHOD], type, propertyKey, searchParent);
  }
  onProperty<X>(
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
    searchParent = false,
  ): AnnotationContext<TargetType.PROPERTY>[] {
    return this._find([TargetType.PROPERTY], type, propertyKey, searchParent);
  }
  onArgs<X>(
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
    searchParent = false,
  ): AnnotationContext<TargetType.PARAMETER>[] {
    return this._find([TargetType.PARAMETER], type, propertyKey, searchParent);
  }

  on(filter: AnnotationSelectionFilter): AnnotationContext[] {
    const { target, searchParent } = filter;
    assert(isObject(target));
    return this._find(
      filter.types ?? [target.type],
      target.proto?.constructor,
      (target as AnnotationTarget<TargetType.METHOD>).propertyKey as any,
      searchParent,
    );
  }

  private _find<X>(
    decoratorTypes: TargetType[],
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
    includeParent = false,
  ): AnnotationContext[] {
    if (!type) {
      assert(!includeParent);

      return this.annotationSet.getAnnotations(
        decoratorTypes,
        this.annotationsRefs,
        undefined,
        propertyKey,
      );
    }
    // search annotations on given type
    const classTarget = this.targetFactory.of(type);

    assert(!!classTarget);
    if (!classTarget) {
      return [];
    }

    // search extends the search to parent types ?
    const classTargets = includeParent
      ? [classTarget, ...getAncestors(classTarget)]
      : [classTarget];

    return classTargets
      .map((target) => target.ref)
      .flatMap((ref) =>
        this.annotationSet.getAnnotations(
          decoratorTypes,
          this.annotationsRefs,
          ref,
          propertyKey,
        ),
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
  select(...annotations: (AnnotationRef | Annotation)[]): AnnotationSelector {
    return new AnnotationSelector(
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
