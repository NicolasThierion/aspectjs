import { ConstructorType, assert, getPrototype } from '@aspectjs/common/utils';
import { AnnotationContext } from '../../annotation-context';
import { AnnotationRef } from '../../annotation-ref';
import { AnnotationStub, AnnotationType } from '../../annotation.types';
import { AnnotationTarget } from '../../target/annotation-target';
import { AnnotationTargetFactory } from '../../target/annotation-target.factory';
import { _AnnotationTargetImpl } from '../../target/annotation-target.impl';
import { _AnnotationContextSet } from './annotation-context-set';
import { BoundAnnotationContext } from './bound-annotation-context';

export interface AnnotationSelectorOptions {
  /**
   * Search for the annotation in parent classes.
   */
  searchParents: boolean;
}

export class AnnotationsSelector<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub = AnnotationStub,
  X = unknown,
> {
  private readonly targetFactory: AnnotationTargetFactory;
  private readonly annotationSet: _AnnotationContextSet;
  private readonly annotationsRefs: Set<AnnotationRef> | undefined;
  private readonly decoratorTypes: T[];
  private readonly type?: ConstructorType<X>;
  private readonly propertyKey?: string | symbol;

  constructor(selector: AnnotationsSelector<T, S, X>);
  constructor(
    targetFactory: AnnotationTargetFactory,
    annotationSet: _AnnotationContextSet,
    annotationsRefs: Set<AnnotationRef> | undefined,
    decoratorTypes: T[],
    type?: ConstructorType<X> | X,
    propertyKey?: string | symbol,
  );
  constructor(
    targetFactory: AnnotationTargetFactory | AnnotationsSelector<T, S, X>,
    annotationSet?: _AnnotationContextSet,
    annotationsRefs?: Set<AnnotationRef> | undefined,
    decoratorTypes?: T[],
    type?: ConstructorType<X> | X,
    propertyKey?: string | symbol,
  ) {
    if (targetFactory instanceof AnnotationsSelector) {
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

  find(options?: AnnotationSelectorOptions): AnnotationContext<T, S, X>[] {
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
  if (!target.parentClass) {
    return [];
  }
  return [
    target.parentClass as AnnotationTarget<T, any>,
    ...getAncestors<T>(target.parentClass as AnnotationTarget<T, any>),
  ];
}

export class BoundAnnotationsSelector<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub = AnnotationStub,
  X = unknown,
> extends AnnotationsSelector<T, S, X> {
  constructor(
    selector: AnnotationsSelector<T, S, X>,
    private instance: unknown,
    private args?: unknown[],
  ) {
    super(selector);
  }
  override find(
    options?: AnnotationSelectorOptions,
  ): BoundAnnotationContext<T, S, X>[] {
    return super.find(options).map((ctxt) => {
      return Object.setPrototypeOf(
        {
          ...ctxt,
          target: (ctxt.target as _AnnotationTargetImpl)._bind(
            this.instance,
            this.args,
          ),
        },
        Object.getPrototypeOf(ctxt),
      );
    });
  }
}
