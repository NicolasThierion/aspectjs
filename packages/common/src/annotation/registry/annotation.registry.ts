import {
  assert,
  ConstructorType,
  getAnnotationRef,
  isObject,
} from '@aspectjs/common/utils';
import type { AnnotationContext } from '../annotation-context';
import type { AnnotationRef } from '../annotation-ref';
import { Annotation, AnnotationType, TargetType } from '../annotation.types';
import type {
  AnnotationTarget,
  AnnotationTargetRef,
} from '../target/annotation-target';
import type { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { DecoratorTargetArgs } from '../target/target-args';

type ByAnnotationSet = {
  byClassTargetRef: Map<AnnotationTargetRef, AnnotationContext>;
};
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
          ? annotationRefs.map((ref) => m.get(getAnnotationRef(ref)))
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
  ): AnnotationContext<TargetType.CLASS>[] {
    return this._find([TargetType.CLASS], type);
  }
  onMethod<X = any>(
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
  ): AnnotationContext<TargetType.METHOD>[] {
    return this._find([TargetType.METHOD], type, propertyKey);
  }
  onProperty<X>(
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
  ): AnnotationContext<TargetType.PROPERTY>[] {
    return this._find([TargetType.PROPERTY], type, propertyKey);
  }
  onArgs<X>(
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
  ): AnnotationContext<TargetType.PARAMETER>[] {
    return this._find([TargetType.PARAMETER], type, propertyKey);
  }

  on<T extends AnnotationType>(type: T): AnnotationContext[];
  on<X>(target: AnnotationTarget<TargetType, X>): AnnotationContext[];
  on(
    targetOrType: AnnotationTarget<TargetType, any> | TargetType,
  ): AnnotationContext[] {
    if (isObject(targetOrType)) {
      return this._find(
        [targetOrType.type],
        targetOrType.proto.constructor,
        (targetOrType as AnnotationTarget<TargetType.METHOD>)
          .propertyKey as any,
      );
    } else {
      return this._find([targetOrType]);
    }
  }

  private _find<X>(
    decoratorTypes: TargetType[],
    type?: ConstructorType<X>,
    propertyKey?: keyof X,
  ): AnnotationContext[] {
    let classTargetRef: AnnotationTargetRef | undefined = undefined;
    if (type) {
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
  find(...annotations: (AnnotationRef | Annotation)[]): AnnotationSelector {
    return new AnnotationSelector(
      this.targetFactory,
      this.annotationSet,
      annotations.map(getAnnotationRef),
    );
  }
}
