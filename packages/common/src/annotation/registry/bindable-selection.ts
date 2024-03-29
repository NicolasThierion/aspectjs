import { AnnotationContext } from '../annotation-context';
import {
  Annotation,
  AnnotationStub,
  AnnotationType,
} from '../annotation.types';
import { _AnnotationTargetImpl } from '../target/annotation-target.impl';
import { BoundAnnotationTarget } from '../target/bound-annotation-target';
import {
  AnnotationsByTypeSelection,
  AnnotationsByTypeSelectionOptions,
} from './by-type-selection';

export interface BoundAnnotationContext<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub = AnnotationStub,
  X = unknown,
> extends AnnotationContext<T, S, X> {
  readonly target: BoundAnnotationTarget<T, X>;
}
export class BoundAnnotationsByTypeSelection<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub = AnnotationStub,
  X = unknown,
> extends AnnotationsByTypeSelection<T, S, X> {
  constructor(
    selection: AnnotationsByTypeSelection<T, S, X>,
    private instance: unknown,
    private args?: unknown[],
  ) {
    super(selection);
  }
  override find(
    options?: AnnotationsByTypeSelectionOptions,
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
  override filter<S2 extends AnnotationStub>(
    annotation: Annotation<AnnotationType, S2>,
  ): BoundAnnotationsByTypeSelection<T, S2, X>;
  override filter(
    ...annotations: Annotation[]
  ): BoundAnnotationsByTypeSelection<T, S, X>;
  override filter(
    ...annotations: Annotation[]
  ): BoundAnnotationsByTypeSelection<T, S, X> {
    return new BoundAnnotationsByTypeSelection(
      super.filter(...annotations),
      this.instance,
      this.args,
    );
  }
}
export class BindableAnnotationsByTypeSelection<
  T extends AnnotationType = AnnotationType,
  X = unknown,
  S extends AnnotationStub = AnnotationStub,
> extends AnnotationsByTypeSelection<T, S, X> {
  bind(
    instance: unknown,
    args?: unknown[],
  ): BoundAnnotationsByTypeSelection<T, S, X> {
    return new BoundAnnotationsByTypeSelection(this, instance, args);
  }

  override filter<S2 extends AnnotationStub>(
    annotation: Annotation<AnnotationType, S2>,
  ): BindableAnnotationsByTypeSelection<T, X, S2>;
  override filter(
    ...annotations: Annotation[]
  ): BindableAnnotationsByTypeSelection<T, X>;
  override filter(
    ...annotations: Annotation[]
  ): BindableAnnotationsByTypeSelection<T, X> {
    return new BindableAnnotationsByTypeSelection(super.filter(...annotations));
  }
}
