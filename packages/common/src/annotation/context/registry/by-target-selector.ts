import {
  ConstructorType,
  assert,
  getPrototype,
  isClassInstance,
  isObject,
} from '@aspectjs/common/utils';
import { AnnotationRef } from '../../annotation-ref';
import { AnnotationStub, AnnotationType } from '../../annotation.types';
import { AnnotationTarget } from '../../target/annotation-target';
import { AnnotationTargetFactory } from '../../target/annotation-target.factory';
import { _AnnotationContextSet } from './annotation-context-set';
import { AnnotationSelectionFilter } from './selection-filter';
import { AnnotationsSelector, BoundAnnotationsSelector } from './selector';

/**
 * Selects annotations based on their type or target.
 */
export class AnnotationByTargetSelector<
  S extends AnnotationStub = AnnotationStub,
> {
  constructor(
    private readonly targetFactory: AnnotationTargetFactory,
    private readonly annotationSet: _AnnotationContextSet,
    private readonly annotationsRefs: Set<AnnotationRef> | undefined,
  ) {}

  all<X = unknown>(
    type?: ConstructorType<X>,
  ): AnnotationsSelector<AnnotationType, S, X>;
  all<X = unknown>(type?: X): BoundAnnotationsSelector<AnnotationType, S, X>;
  all<X = unknown>(
    type?: X | ConstructorType<X>,
  ): AnnotationsSelector<AnnotationType, S, X> {
    return this.createSelector(
      [
        AnnotationType.CLASS,
        AnnotationType.METHOD,
        AnnotationType.PROPERTY,
        AnnotationType.PARAMETER,
      ],
      type,
    );
  }

  onClass<X = unknown>(
    type?: ConstructorType<X>,
  ): AnnotationsSelector<AnnotationType.CLASS, S, X>;
  onClass<X = unknown>(
    type?: X,
  ): BoundAnnotationsSelector<AnnotationType.CLASS, S, X>;
  onClass<X = unknown>(
    type?: ConstructorType<X> | X,
  ): AnnotationsSelector<AnnotationType.CLASS, S, X> {
    return this.createSelector([AnnotationType.CLASS], type);
  }

  onMethod<X = any, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsSelector<AnnotationType.METHOD, S, X> {
    return this.createSelector(
      [AnnotationType.METHOD],
      type ? getPrototype(type).constructor : undefined,
      propertyKey,
    );
  }
  onProperty<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsSelector<AnnotationType.PROPERTY, S, X>;
  onProperty<X, K extends keyof X = keyof X>(
    type?: X,
    propertyKey?: K,
  ): BoundAnnotationsSelector<AnnotationType.PROPERTY, S, X>;
  onProperty<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsSelector<AnnotationType.PROPERTY, S, X> {
    return this.createSelector([AnnotationType.PROPERTY], type, propertyKey);
  }

  onArgs<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsSelector<AnnotationType.PARAMETER, S, X> {
    return this.createSelector([AnnotationType.PARAMETER], type, propertyKey);
  }

  private createSelector<
    T extends AnnotationType = AnnotationType,
    X = unknown,
    K extends keyof X = any,
  >(
    annotationTypes: T[],
    targetType?: X | ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsSelector<T, S, X> {
    const selection = new AnnotationsSelector<T, S, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      annotationTypes,
      targetType,
      propertyKey as string | symbol,
    );
    if (isClassInstance(targetType)) {
      return new BoundAnnotationsSelector<T, S, X>(selection, targetType);
    }

    return selection;
  }

  on<X>(
    filter: AnnotationSelectionFilter,
  ): AnnotationsSelector<AnnotationType, S, X> {
    const { target, types } = filter;
    assert(isObject(target));

    return new AnnotationsSelector<AnnotationType, S, X>(
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
