import {
  ConstructorType,
  isClassInstance,
  assert,
  isObject,
  getPrototype,
} from '@aspectjs/common/utils';
import { AnnotationRef } from '../annotation-ref';
import { AnnotationType } from '../annotation.types';
import { AnnotationTarget } from '../target/annotation-target';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { AnnotationSelectionFilter } from './selection-filter';
import { BoundAnnotationsByTypeSelection } from './bindable-selection';
import { AnnotationsByTypeSelection } from './by-type-selection';
import { _AnnotationsSet } from './annotation-set';

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
    return this.createSelection(
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
  ): AnnotationsByTypeSelection<AnnotationType.CLASS, X>;
  onClass<X = unknown>(
    type?: X,
  ): BoundAnnotationsByTypeSelection<AnnotationType.CLASS, X>;
  onClass<X = unknown>(
    type?: ConstructorType<X> | X,
  ): AnnotationsByTypeSelection<AnnotationType.CLASS, X> {
    return this.createSelection([AnnotationType.CLASS], type);
  }

  onMethod<X = any, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.METHOD, X> {
    return this.createSelection(
      [AnnotationType.METHOD],
      type ? getPrototype(type).constructor : undefined,
      propertyKey,
    );
  }
  onProperty<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.PROPERTY, X>;
  onProperty<X, K extends keyof X = keyof X>(
    type?: X,
    propertyKey?: K,
  ): BoundAnnotationsByTypeSelection<AnnotationType.PROPERTY, X>;
  onProperty<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.PROPERTY, X> {
    return this.createSelection([AnnotationType.PROPERTY], type, propertyKey);
  }

  onArgs<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.PARAMETER, X> {
    return this.createSelection(
      [AnnotationType.PARAMETER],
      type ? getPrototype(type).constructor : undefined,
      propertyKey,
    );
  }

  private createSelection<
    T extends AnnotationType = AnnotationType,
    X = unknown,
    K extends keyof X = any,
  >(
    annotationTypes: T[],
    targetType?: X | ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<T, X> {
    const selection = new AnnotationsByTypeSelection<T, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      annotationTypes,
      targetType,
      propertyKey as string | symbol,
    );
    if (isClassInstance(targetType)) {
      return new BoundAnnotationsByTypeSelection<T, X>(selection, targetType);
    }

    return selection;
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
