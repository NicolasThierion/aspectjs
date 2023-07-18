import { AnnotationsByTypeSelection } from '@aspectjs/common';

import { AdviceTarget } from './advice.type';
import { JoinPoint } from './joinpoint';

import type { AfterContext } from '../advices/after/after.context';
import type {
  JoinpointType,
  ToAnnotationType,
} from '../pointcut/pointcut-target.type';

import type { AfterReturnContext } from '../advices/after-return/after-return.context';
import type { AfterThrowContext } from '../advices/after-throw/after-throw.context';
import type { AroundContext } from '../advices/around/around.context';
import type { BeforeContext } from '../advices/before/before.context';
import type { CompileContext } from '../advices/compile/compile.context';

export class MutableAdviceContext<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> {
  /** The annotations contexts **/
  annotations: AnnotationsByTypeSelection<ToAnnotationType<T>, X>;
  /** The 'this' instance bound to the current execution context **/
  instance?: X | null;
  /** the arguments originally passed to the joinpoint **/
  args?: any[];
  /** The symbol targeted by this advice (class, method, property or parameter **/
  target: AdviceTarget<T, X>;
  /** The value originally returned by the joinpoint **/
  value?: unknown;
  /** Hold the original function, bound to its execution context and it original parameters **/
  joinpoint?: JoinPoint;
  /** The error originally thrown by the joinpoint **/
  error?: Error | unknown;

  constructor(
    ctxt: Partial<MutableAdviceContext<T, X>> &
      Pick<MutableAdviceContext<T, X>, 'target' | 'annotations'>,
  ) {
    this.annotations = ctxt.annotations!;
    this.instance = ctxt.instance;
    this.args = ctxt.args;
    this.target = ctxt.target;
    this.value = ctxt.value;
    this.joinpoint = ctxt.joinpoint;
    this.error = ctxt.error;
  }

  asAfterContext(
    overrides: Partial<AfterContext<T, X>> = {},
  ): AfterContext<T, X> {
    return copyProps<AfterContext<T, X>>(
      this,
      overrides,
      'annotations',
      'instance',
      'args',
      'target',
    );
  }

  asBeforeContext(
    overrides: Partial<BeforeContext<T, X>> = {},
  ): BeforeContext<T, X> {
    return copyProps<BeforeContext<T, X>>(
      this,
      overrides,
      'annotations',
      'instance',
      'args',
      'target',
    );
  }

  asAfterReturnContext(
    overrides: Partial<AfterReturnContext<T, X>> = {},
  ): AfterReturnContext<T, X> {
    return copyProps<AfterReturnContext<T, X>>(
      this,
      overrides,
      'annotations',
      'instance',
      'args',
      'target',
      'value',
    );
  }

  asAfterThrowContext(
    overrides: Partial<AfterThrowContext<T, X>> = {},
  ): AfterThrowContext<T, X> {
    return copyProps<AfterThrowContext<T, X>>(
      this,
      overrides,
      'annotations',
      'instance',
      'args',
      'target',
      'error',
    );
  }

  asCompileContext(
    overrides: Partial<CompileContext<T, X>> = {},
  ): CompileContext<T, X> {
    return copyProps<CompileContext<T, X>>(
      this,
      overrides,
      'annotations',
      'target',
    );
  }

  asAroundContext(
    overrides: Partial<AroundContext<T, X>> = {},
  ): AroundContext<T, X> {
    return copyProps<AroundContext<T, X>>(
      this,
      overrides,
      'annotations',
      'instance',
      'args',
      'target',
      'joinpoint',
      'value',
    );
  }
}

function copyProps<A>(
  ctxt: MutableAdviceContext,
  overrides: Partial<MutableAdviceContext> = {},
  ...keys: (keyof A)[]
) {
  return keys
    .map((prop) => {
      const value =
        typeof (overrides as any)[prop] !== 'undefined'
          ? (overrides as any)[prop]
          : (ctxt as any)[prop];
      return {
        prop,
        value,
      };
    })
    .reduce((res, { prop, value }) => {
      res[prop] = value as any;
      return res;
    }, {} as A);
}
