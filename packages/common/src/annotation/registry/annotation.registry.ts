import { assert } from '@aspectjs/common/utils';
import type { ConstryctorType } from '../../constructor.type';
import type { ReflectContext } from '../../reflect/context';
import type { ReflectContextModule } from '../../reflect/reflect-context-module.type';
import type { AnnotationContext } from '../annotation-context';
import type { AnnotationRef } from '../annotation-ref';
import { Annotation, DecoratorType } from '../annotation.types';
import type { AnnotationTargetRef } from '../target/annotation-target';
import type { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { DecoratorTargetArgs } from '../target/target-args';
import { REGISTER_ANNOTATION_HOOK } from './hooks/register-annotation.hook';

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
    classTargerRef?: AnnotationTargetRef | undefined,
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
        classTargerRef ? map?.get(classTargerRef) ?? [] : [...map.values()],
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

  onClass(type?: any): AnnotationContext<DecoratorType.CLASS>[] {
    throw new Error('not implemented');
  }
  all<T = unknown>(type?: T | ConstryctorType<T>): AnnotationContext[] {
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
  onMethod<T = any>(
    type?: T,
    propertyKey?: keyof T,
  ): AnnotationContext<DecoratorType.METHOD>[] {
    return this._find([DecoratorType.METHOD], type, propertyKey);
  }
  onProperty<T>(
    type?: T,
    propertyKey?: keyof T,
  ): AnnotationContext<DecoratorType.PROPERTY>[] {
    return this._find([DecoratorType.PROPERTY], type, propertyKey);
  }
  onArgs<T>(
    type?: T,
    propertyKey?: keyof T,
  ): AnnotationContext<DecoratorType.PARAMETER>[] {
    return this._find([DecoratorType.PARAMETER], type, propertyKey);
  }

  private _find<T>(
    decoratorTypes: DecoratorType[],
    type?: T | ConstryctorType<T>,
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

export class _AnnotationRegistryModule
  implements ReflectContextModule<AnnotationRegistry>
{
  order = 100;
  bootstrap(context: ReflectContext): AnnotationRegistry {
    const targetFactory = context.get('annotationTargetFactory');
    const annotationRegistry = new AnnotationRegistry(targetFactory);
    context
      .get('annotationsHooksRegistry')
      .add(REGISTER_ANNOTATION_HOOK(targetFactory, annotationRegistry));
    return annotationRegistry;
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
