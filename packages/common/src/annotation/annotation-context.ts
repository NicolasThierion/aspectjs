import { assert } from '../../dist/common-utils';
import { AnnotationRef } from './annotation-ref';
import { Annotation, TargetType } from './annotation.types';
import type { AnnotationTarget } from './target/annotation-target';

export class AnnotationContext<T extends TargetType = TargetType, X = unknown> {
  public readonly ref: AnnotationRef;
  constructor(
    ref: Annotation | AnnotationRef,
    public readonly args: any[],
    public readonly target: AnnotationTarget<T, X>,
  ) {
    this.ref = AnnotationRef.of(ref);
  }

  toString(): string {
    return `@${this.ref.groupId}:${this.ref.name} on ${this.target.label}`;
  }
}

export class BindableAnnotationContext<
  T extends TargetType = TargetType,
  X = unknown,
> extends AnnotationContext<T, X> {
  bind(
    instance: X,
    args?: T extends TargetType.PARAMETER ? unknown[] : never,
  ): BoundAnnotationContext<T, X> {
    let value: any;

    switch (this.target.type) {
      case TargetType.CLASS:
        value = instance;
        break;
      case TargetType.METHOD:
      case TargetType.PROPERTY:
        value = (instance as any)[this.target.propertyKey!];
        break;
      case TargetType.PARAMETER:
        if (!(args instanceof Array)) {
          throw new TypeError(
            'Expected annotation.bind() to receive an array of parameters',
          );
        } else if (args.length < this.target.parameterIndex) {
          throw new TypeError(
            `Cannot bind annotation ${this.ref} on parameter ${this.target.parameterIndex} : Received parameter array of length=${args.length}`,
          );
        }
        value = args[this.target.parameterIndex];
        break;
      default:
        assert(false);
    }
    if (!value) {
      throw new TypeError(`Invalid parameter for annotation.bind(): ${value}`);
    }
    return new BoundAnnotationContext(this, value);
  }
}
export class BoundAnnotationContext<
  T extends TargetType = TargetType,
  X = unknown,
> extends AnnotationContext<T, X> {
  value: unknown;
  constructor(annotationContext: AnnotationContext<T, X>, value: unknown) {
    super(
      annotationContext.ref,
      annotationContext.args,
      annotationContext.target,
    );
    this.value = value;
  }
}

// TODO
// export class _AnnotationContextImpl<
//   T extends DecoratorType = DecoratorType,
//   X = unknown,
// > extends AnnotationContext<T, X> {
//   get value(): any {
//     throw new TypeError('annotation is not bound to a value');
//   }

//   withValue<V>(valueProvider: () => V): _ValuedAnnotationContext<T, X, V> {
//     return new _ValuedAnnotationContext<T, X, V>(this, valueProvider);
//   }
// }

// TODO
// export class _ValuedAnnotationContext<
//   T extends DecoratorType = DecoratorType,
//   X = unknown,
//   V = unknown,
// > extends _AnnotationContextImpl<T, X> {
//   constructor(
//     annotationContext: _AnnotationContextImpl<T, X>,
//     private readonly _valueProvider: () => V,
//   ) {
//     super(
//       annotationContext.annotation,
//       annotationContext.args,
//       annotationContext.target,
//     );
//   }

//   override get value(): V {
//     return this._valueProvider();
//   }
// }
