import {
  ConstructorType,
  assert,
  getPrototype,
  isClassInstance,
  isObject,
} from '@aspectjs/common/utils';
import { AnnotationRef } from '../annotation-ref';
import { AnnotationStub, AnnotationType } from '../annotation.types';
import { AnnotationTarget } from '../target/annotation-target';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { _AnnotationsSet } from './annotation-set';
import { BoundAnnotationsByTypeSelection } from './bindable-selection';
import { AnnotationsByTypeSelection } from './by-type-selection';
import { AnnotationSelectionFilter } from './selection-filter';

/**
 * Selects annotations based on their type or target.
 */
export class AnnotationsSelection<S extends AnnotationStub = AnnotationStub> {
  constructor(
    private readonly targetFactory: AnnotationTargetFactory,
    private readonly annotationSet: _AnnotationsSet,
    private readonly annotationsRefs: Set<AnnotationRef> | undefined,
  ) {}

  all<X = unknown>(
    type?: ConstructorType<X>,
  ): AnnotationsByTypeSelection<AnnotationType, S, X>;
  all<X = unknown>(
    type?: X,
  ): BoundAnnotationsByTypeSelection<AnnotationType, S, X>;
  all<X = unknown>(
    type?: X | ConstructorType<X>,
  ): AnnotationsByTypeSelection<AnnotationType, S, X> {
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
  ): AnnotationsByTypeSelection<AnnotationType.CLASS, S, X>;
  onClass<X = unknown>(
    type?: X,
  ): BoundAnnotationsByTypeSelection<AnnotationType.CLASS, S, X>;
  onClass<X = unknown>(
    type?: ConstructorType<X> | X,
  ): AnnotationsByTypeSelection<AnnotationType.CLASS, S, X> {
    return this.createSelection([AnnotationType.CLASS], type);
  }

  onMethod<X = any, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.METHOD, S, X> {
    return this.createSelection(
      [AnnotationType.METHOD],
      type ? getPrototype(type).constructor : undefined,
      propertyKey,
    );
  }
  onProperty<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X>,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.PROPERTY, S, X>;
  onProperty<X, K extends keyof X = keyof X>(
    type?: X,
    propertyKey?: K,
  ): BoundAnnotationsByTypeSelection<AnnotationType.PROPERTY, S, X>;
  onProperty<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.PROPERTY, S, X> {
    return this.createSelection([AnnotationType.PROPERTY], type, propertyKey);
  }

  onArgs<X, K extends keyof X = keyof X>(
    type?: ConstructorType<X> | X,
    propertyKey?: K,
  ): AnnotationsByTypeSelection<AnnotationType.PARAMETER, S, X> {
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
  ): AnnotationsByTypeSelection<T, S, X> {
    const selection = new AnnotationsByTypeSelection<T, S, X>(
      this.targetFactory,
      this.annotationSet,
      this.annotationsRefs,
      annotationTypes,
      targetType,
      propertyKey as string | symbol,
    );
    if (isClassInstance(targetType)) {
      return new BoundAnnotationsByTypeSelection<T, S, X>(
        selection,
        targetType,
      );
    }

    return selection;
  }

  on<X>(
    filter: AnnotationSelectionFilter,
  ): AnnotationsByTypeSelection<AnnotationType, S, X> {
    const { target, types } = filter;
    assert(isObject(target));

    return new AnnotationsByTypeSelection<AnnotationType, S, X>(
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
