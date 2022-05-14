import { assert } from '@aspectjs/common/utils';
import type { ConstructorType } from '../../constructor.type';
import type { AnnotationContext } from '../annotation-context';
import type { AnnotationRef } from '../annotation-ref';
import { Annotation, DecoratorType } from '../annotation.types';
import type { AnnotationTargetRef } from '../target/annotation-target';
import type { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { DecoratorTargetArgs } from '../target/target-args';

type ByAnnotationSet = {
  byClassTargetRef: Map<AnnotationTargetRef, AnnotationContext>;
};
class _AnnotationsSet {
  private buckets: {
    [k in DecoratorType]: Map<AnnotationRef, ByAnnotationSet>;
  } = {
    [DecoratorType.CLASS]: new Map(),
    [DecoratorType.PROPERTY]: new Map(),
    [DecoratorType.METHOD]: new Map(),
    [DecoratorType.PARAMETER]: new Map(),
  };

  getAnnotations(
    decoratorTypes: DecoratorType[],
    annotationRefs: AnnotationRef[],
    classTargetRef?: AnnotationTargetRef | undefined,
    propertyKey?: string | number | symbol | undefined,
  ): AnnotationContext[] {
    const annotationsInClass = decoratorTypes
      .map((t) => this.buckets[t])
      .flatMap((m) =>
        annotationRefs.length
          ? annotationRefs.map((ref) => m.get(ref))
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
      (a: AnnotationContext<DecoratorType.METHOD>) =>
        a.target.propertyKey === propertyKey,
    );
  }

  addAnnotation(ctxt: AnnotationContext) {
    const bucket = this.buckets[ctxt.target.type];
    assert(() => !!bucket);
    const byAnnotationSet = bucket.get(ctxt.annotation) ?? {
      byClassTargetRef: new Map<AnnotationTargetRef, AnnotationContext>(),
    };

    byAnnotationSet.byClassTargetRef.set(ctxt.target.declaringClass.ref, ctxt);
    bucket.set(ctxt.annotation, byAnnotationSet);
  }
}

export class AnnotationSelector {
  constructor(
    private readonly targetFactory: AnnotationTargetFactory,
    private readonly annotationSet: _AnnotationsSet,
    private readonly annotationsRefs: AnnotationRef[],
  ) {}

  all<T = unknown>(type?: ConstructorType<T>): AnnotationContext[] {
    return this._find(
      [
        DecoratorType.CLASS,
        DecoratorType.METHOD,
        DecoratorType.PROPERTY,
        DecoratorType.PARAMETER,
      ],
      type,
    );
  }
  onClass<T = unknown>(
    type?: ConstructorType<T>,
  ): AnnotationContext<DecoratorType.CLASS>[] {
    return this._find([DecoratorType.CLASS], type);
  }
  onMethod<T = any>(
    type?: ConstructorType<T>,
    propertyKey?: keyof T,
  ): AnnotationContext<DecoratorType.METHOD>[] {
    return this._find([DecoratorType.METHOD], type, propertyKey);
  }
  onProperty<T>(
    type?: ConstructorType<T>,
    propertyKey?: keyof T,
  ): AnnotationContext<DecoratorType.PROPERTY>[] {
    return this._find([DecoratorType.PROPERTY], type, propertyKey);
  }
  onArgs<T>(
    type?: ConstructorType<T>,
    propertyKey?: keyof T,
  ): AnnotationContext<DecoratorType.PARAMETER>[] {
    return this._find([DecoratorType.PARAMETER], type, propertyKey);
  }

  private _find<T>(
    decoratorTypes: DecoratorType[],
    type?: ConstructorType<T>,
    propertyKey?: keyof T,
  ): AnnotationContext[] {
    let classTargetRef: AnnotationTargetRef | undefined = undefined;
    if (!!type) {
      const classTarget = this.targetFactory.find(
        DecoratorTargetArgs.of([type]),
      );

      assert(!!classTarget);
      if (!classTarget) {
        return [];
      }

      classTargetRef = classTarget.ref;
    }
    return this.annotationSet.getAnnotations(
      decoratorTypes,
      this.annotationsRefs,
      classTargetRef,
      propertyKey,
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
  find(...annotations: Annotation[]): AnnotationSelector {
    return new AnnotationSelector(
      this.targetFactory,
      this.annotationSet,
      annotations,
    );
  }
}
