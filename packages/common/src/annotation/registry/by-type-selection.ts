import { ConstructorType, assert } from '@aspectjs/common/utils';
import { AnnotationContext } from '../annotation-context';
import { AnnotationRef } from '../annotation-ref';
import {
  AnnotationType,
  AnnotationStub,
  Annotation,
} from '../annotation.types';
import { AnnotationTarget } from '../target/annotation-target';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { _AnnotationsSet } from './annotation-set';

export interface AnnotationsByTypeSelectionOptions {
  /**
   * Search for the annotation in parent classes.
   */
  searchParents: boolean;
}

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
    type?: ConstructorType<X> | X,
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
