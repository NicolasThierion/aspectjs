import type {
  ConstructorType,
  MethodPropertyDescriptor,
} from '@aspectjs/common/utils';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';

import type { JoinPoint } from '../../advice/joinpoint';
import type { PointcutKind } from '../../pointcut/pointcut-kind.type';

export type CompiledSymbol<
  T extends PointcutKind = PointcutKind,
  X = unknown,
> = T extends PointcutKind.CLASS
  ? ConstructorType<X>
  : T extends PointcutKind.METHOD | PointcutKind.PARAMETER
  ? MethodPropertyDescriptor
  : T extends PointcutKind.GET_PROPERTY | PointcutKind.SET_PROPERTY
  ? PropertyDescriptor
  : never;

export interface WeaverCanvasStrategy<
  T extends PointcutKind = PointcutKind,
  X = unknown,
> {
  compile(ctxt: MutableAdviceContext<T, X>): CompiledSymbol<T, X> | undefined;

  before(ctxt: MutableAdviceContext<T, X>): void;

  callJoinpoint(
    ctxt: MutableAdviceContext<T, X>,
    originalSymbol: CompiledSymbol<T, X>,
  ): unknown;

  afterReturn(ctxt: MutableAdviceContext<T, X>): unknown;

  afterThrow(ctxt: MutableAdviceContext<T, X>): unknown;

  after(ctxt: MutableAdviceContext<T, X>): void;

  around(ctxt: MutableAdviceContext<T, X>): JoinPoint;

  link?(
    ctxt: MutableAdviceContext<T, X>,
    compiledSymbol: CompiledSymbol<T, X>,
    joinpoint: (...args: any[]) => T,
  ): CompiledSymbol<T, X>;
}
