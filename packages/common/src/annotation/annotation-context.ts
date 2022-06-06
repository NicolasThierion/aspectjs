import type { Annotation, TargetType } from './annotation.types';
import type { AnnotationTarget } from './target/annotation-target';

export class AnnotationContext<T extends TargetType = TargetType, X = unknown> {
  constructor(
    public readonly annotation: Annotation,
    public readonly args: any[],
    public readonly target: AnnotationTarget<T, X>,
  ) {}

  toString(): string {
    return `@${this.annotation.groupId}:${this.annotation.name} on ${this.target.label}`;
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
