import { ConstructorType, assert, getPrototype } from '@aspectjs/common/utils';
import { AnnotationContext } from '../../annotation-context';
import { AnnotationRef } from '../../annotation-ref';
import {
  Annotation,
  AnnotationKind,
  AnnotationStub,
} from '../../annotation.types';
import { AnnotationTarget } from '../../target/annotation-target';
import { AnnotationTargetFactory } from '../../target/annotation-target.factory';
import { _AnnotationContextSet } from './annotation-context-set';
import { AnnotationsSelector } from './selector';

export interface AnnotationsByTypeSelectionOptions {
  /**
   * Search for the annotation in parent classes.
   */
  searchParents: boolean;
}

export class AnnotationsByRefSelector<
  T extends AnnotationKind = AnnotationKind,
  S extends AnnotationStub = AnnotationStub,
  X = unknown,
> {
  private readonly targetFactory: AnnotationTargetFactory;
  private readonly annotationSet: _AnnotationContextSet;
  private readonly annotationsRefs: Set<AnnotationRef> | undefined;
  private readonly decoratorTypes: T[];
  private readonly type?: ConstructorType<X>;
  private readonly propertyKey?: string | symbol;

  constructor(selection: AnnotationsByRefSelector<T, S, X>);
  constructor(
    targetFactory: AnnotationTargetFactory,
    annotationSet: _AnnotationContextSet,
    annotationsRefs: Set<AnnotationRef> | undefined,
    decoratorTypes: T[],
    type?: ConstructorType<X> | X,
    propertyKey?: string | symbol,
  );
  constructor(
    targetFactory: AnnotationTargetFactory | AnnotationsByRefSelector<T, S, X>,
    annotationSet?: _AnnotationContextSet,
    annotationsRefs?: Set<AnnotationRef> | undefined,
    decoratorTypes?: T[],
    type?: ConstructorType<X> | X,
    propertyKey?: string | symbol,
  ) {
    if (targetFactory instanceof AnnotationsByRefSelector) {
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
      this.type = type ? getPrototype(type).constructor : undefined;
      this.propertyKey = propertyKey;
    }
  }

  annotations<S2 extends AnnotationStub>(
    annotation: Annotation<AnnotationKind, S2>,
  ): AnnotationsSelector<T, S2, X>;
  annotations(
    ...annotations: (
      | AnnotationRef
      | Annotation<AnnotationKind, AnnotationStub>
    )[]
  ): AnnotationsSelector<T, S, X>;
  annotations(
    ...annotations: (
      | Annotation<AnnotationKind, AnnotationStub>
      | AnnotationRef
    )[]
  ): AnnotationsSelector<T, S, X> {
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

    return new AnnotationsSelector(
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
      assert(!!this.annotationSet);
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

function getAncestors<T extends AnnotationKind>(
  target: AnnotationTarget<T, any>,
): Array<AnnotationTarget<T, any>> {
  if (!target.parentClass) {
    return [];
  }
  return [
    target.parentClass as AnnotationTarget<T, any>,
    ...getAncestors<T>(target.parentClass as AnnotationTarget<T, any>),
  ];
}
