import {
  assert,
  ConstructorType,
  isClassInstance,
  isObject,
} from '@aspectjs/common/utils';
import { AnnotationContext } from '../annotation-context';
import { AnnotationRef } from '../annotation-ref';
import {
  Annotation,
  AnnotationStub,
  AnnotationType,
} from '../annotation.types';
import type {
  AnnotationTarget,
  AnnotationTargetRef,
} from '../target/annotation-target';
import type { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { BoundAnnotationsByTypeSelection } from './../../../../core/src/advice/bindable-annotation-selection';
import { AnnotationSelectionFilter } from './annotation-selection-filter';

type ByAnnotationSet = {
  byClassTargetRef: Map<AnnotationTargetRef, AnnotationContext[]>;
};

/**
 * @internal
 */
class _AnnotationsSet {
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

export interface AnnotationsByTypeSelectionOptions {
  /**
   * Search for the annotation in parent classes.
   */
  searchParents: boolean;
}
/**
 * @internal
 */
export class AnnotationsByTypeSelection<
  T extends AnnotationType = AnnotationType,
  X = unknown,
  S extends AnnotationStub = AnnotationStub,
> {
  private readonly targetFactory: AnnotationTargetFactory;
  private readonly annotationSet: _AnnotationsSet;
  private readonly annotationsRefs: Set<AnnotationRef> | undefined;
  private readonly decoratorTypes: T[];
  private readonly type?: ConstructorType<X>;
  private readonly propertyKey?: string | symbol;

  constructor(selection: AnnotationsByTypeSelection<T, X, S>);
  constructor(
    targetFactory: AnnotationTargetFactory,
    annotationSet: _AnnotationsSet,
    annotationsRefs: Set<AnnotationRef> | undefined,
    decoratorTypes: T[],
    type?: ConstructorType<X>,
    propertyKey?: string | symbol,
  );
  constructor(
    targetFactory:
      | AnnotationTargetFactory
      | AnnotationsByTypeSelection<T, X, S>,
    annotationSet?: _AnnotationsSet,
    annotationsRefs?: Set<AnnotationRef> | undefined,
    decoratorTypes?: T[],
    type?: ConstructorType<X>,
    propertyKey?: string | symbol,
  ) {
    if (targetFactory instanceof AnnotationsByTypeSelection) {
      const selection = targetFactory;
      this.targetFactory = selection.targetFactory;
      this.annotationSet = selection.annotationSet;
      this.annotationsRefs = selection.annotationsRefs;
      this.decoratorTypes = selection.decoratorTypes;
      this.type = selection.type;
      this.propertyKey = selection.propertyKey;
    } else {
      this.targetFactory = targetFactory;
      this.annotationSet = annotationSet!;
      this.annotationsRefs = annotationsRefs;
      this.decoratorTypes = decoratorTypes!;
      this.type = type;
      this.propertyKey = propertyKey;
    }
  }
  filter<S2 extends AnnotationStub>(
    annotation: Annotation<AnnotationType, S2>,
  ): AnnotationsByTypeSelection<T, X, S2>;
  filter(...annotations: Annotation[]): AnnotationsByTypeSelection<T, X>;
  filter(...annotations: Annotation[]): AnnotationsByTypeSelection<T, X> {
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
  }

  find(
    options?: AnnotationsByTypeSelectionOptions,
  ): AnnotationContext<T, S, X>[] {
    if (!this.type) {
      assert(!options?.searchParents);

      return this.annotationSet.getAnnotations(
        this.decoratorTypes,
        this.annotationsRefs,
        undefined,
        this.propertyKey,
      ) as AnnotationContext<T, S, X>[];
    }
    // search annotations on given type
    const classTarget = this.targetFactory.of(this.type);

    assert(!!classTarget);
    if (!classTarget) {
      return [];
    }

    // search extends the search to parent types ?
    const classTargets =
      options?.searchParents ?? true
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
      ) as AnnotationContext<T, S, X>[];
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
  ): AnnotationsByTypeSelection<AnnotationType, X>;
  all<X = unknown>(
    type?: X,
  ): BoundAnnotationsByTypeSelection<AnnotationType, X>;
  all<X = unknown>(
    type?: X | ConstructorType<X>,
  ): AnnotationsByTypeSelection<AnnotationType, X> {
    const selection = new AnnotationsByTypeSelection<AnnotationType, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      [
        AnnotationType.CLASS,
        AnnotationType.METHOD,
        AnnotationType.PROPERTY,
        AnnotationType.PARAMETER,
      ],
      type,
    );

    if (isClassInstance(type)) {
      return new BoundAnnotationsByTypeSelection<AnnotationType, X>(
        selection,
        type,
      );
    }

    return selection;
  }
  onClass<X = unknown>(
    type?: ConstructorType<X>,
  ): AnnotationsByTypeSelection<AnnotationType.CLASS, X> {
    return new AnnotationsByTypeSelection<AnnotationType.CLASS, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      [AnnotationType.CLASS],
      type,
    );
  }
  onMethod<X = any, K extends keyof X = keyof X>(
    type?: ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.METHOD, X> {
    return new AnnotationsByTypeSelection<AnnotationType.METHOD, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      [AnnotationType.METHOD],
      type,
      propertyKey as string | symbol,
    );
  }
  onProperty<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.PROPERTY, X> {
    return new AnnotationsByTypeSelection<AnnotationType.PROPERTY, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      [AnnotationType.PROPERTY],
      type,
      propertyKey as string | symbol,
    );
  }
  onArgs<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.PARAMETER, X> {
    return new AnnotationsByTypeSelection<AnnotationType.PARAMETER, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      [AnnotationType.PARAMETER],
      type,
      propertyKey as string | symbol,
    );
  }

  on<X>(
    filter: AnnotationSelectionFilter,
  ): AnnotationsByTypeSelection<AnnotationType, X> {
    const { target, types } = filter;
    assert(isObject(target));

    return new AnnotationsByTypeSelection<AnnotationType, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      types ??
        (Object.values(AnnotationType).filter(
          (x: any) => !isNaN(x),
        ) as AnnotationType[]),
      target.proto?.constructor,
      (target as AnnotationTarget<AnnotationType.METHOD>).propertyKey as any,
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

  select(
    ...annotations: (
      | Pick<AnnotationRef, 'groupId' | 'name'>
      | Annotation
      | string
    )[]
  ): AnnotationsSelection {
    const annotationsFilter = annotations.length
      ? new Set(
          annotations.filter((a) => a !== undefined).map(AnnotationRef.of),
        )
      : undefined;

    return new AnnotationsSelection(
      this.targetFactory,
      this.annotationSet,
      annotationsFilter,
    );
  }
}

function getAncestors<T extends AnnotationType>(
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
