import {
  ConstructorType,
  assert,
  getPrototype,
  isClassInstance,
  isObject,
} from '@aspectjs/common/utils';
import { AnnotationRef } from '../../annotation-ref';
import { AnnotationKind, AnnotationStub } from '../../annotation.types';
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
  ): AnnotationsSelector<AnnotationKind, S, X>;
  all<X = unknown>(type?: X): BoundAnnotationsSelector<AnnotationKind, S, X>;
  all<X = unknown>(
    type?: X | ConstructorType<X>,
  ): AnnotationsSelector<AnnotationKind, S, X> {
    return this.createSelector(
      [
        AnnotationKind.CLASS,
        AnnotationKind.METHOD,
        AnnotationKind.PROPERTY,
        AnnotationKind.PARAMETER,
      ],
      type,
    );
  }

  onClass<X = unknown>(
    type?: ConstructorType<X>,
  ): AnnotationsSelector<AnnotationKind.CLASS, S, X>;
  onClass<X = unknown>(
    type?: X,
  ): BoundAnnotationsSelector<AnnotationKind.CLASS, S, X>;
  onClass<X = unknown>(
    type?: ConstructorType<X> | X,
  ): AnnotationsSelector<AnnotationKind.CLASS, S, X> {
    return this.createSelector([AnnotationKind.CLASS], type);
  }

  onMethod<X = any, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsSelector<AnnotationKind.METHOD, S, X> {
    return this.createSelector(
      [AnnotationKind.METHOD],
      type ? getPrototype(type).constructor : undefined,
      propertyKey,
    );
  }
  onProperty<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsSelector<AnnotationKind.PROPERTY, S, X>;
  onProperty<X, K extends keyof X = keyof X>(
    type?: X,
    propertyKey?: K,
  ): BoundAnnotationsSelector<AnnotationKind.PROPERTY, S, X>;
  onProperty<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsSelector<AnnotationKind.PROPERTY, S, X> {
    return this.createSelector([AnnotationKind.PROPERTY], type, propertyKey);
  }

  onArgs<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsSelector<AnnotationKind.PARAMETER, S, X> {
    return this.createSelector([AnnotationKind.PARAMETER], type, propertyKey);
  }

  private createSelector<
    T extends AnnotationKind = AnnotationKind,
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
  ): AnnotationsSelector<AnnotationKind, S, X> {
    const { target, types } = filter;
    assert(isObject(target));

    return new AnnotationsSelector<AnnotationKind, S, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      types ??
        (Object.values(AnnotationKind).filter(
          (x: any) => !isNaN(x),
        ) as AnnotationKind[]),
      target.proto?.constructor,
      (target as AnnotationTarget<AnnotationKind.METHOD>).propertyKey as any,
    );
  }
}
