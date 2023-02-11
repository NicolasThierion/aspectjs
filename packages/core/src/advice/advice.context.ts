import { AnnotationContext } from '@aspectjs/common';

import { AdviceTarget } from './advice.type';
import { JoinPoint } from './joinpoint';

import type { AfterContext } from '../advices/after/after.context';
import type {
  PointcutTargetType,
  ToTargetType,
} from './../pointcut/pointcut-target.type';

import type { AfterReturnContext } from '../advices/after-return/after-return.context';
import type { AfterThrowContext } from '../advices/after-throw/after-throw.context';
import type { AroundContext } from '../advices/around/around.context';
import type { CompileContext } from '../advices/compile/compile.context';
import type { BeforeContext } from './../advices/before/before.context';
export type AdviceContext<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> =
  | AfterContext<T, X>
  | BeforeContext<T, X>
  | AfterReturnContext<T, X>
  | AfterThrowContext<T, X>
  | AroundContext<T, X>
  | CompileContext<T, X>;

export class MutableAdviceContext<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> {
  /** The annotations contexts **/
  annotations: Array<AnnotationContext<ToTargetType<T>, X>>;
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

  asAfterContext(): AfterContext<T, X> {
    return copyProps<AfterContext<T, X>>(
      this,
      'annotations',
      'instance',
      'args',
      'target',
    );
  }

  asBeforeContext(): BeforeContext<T, X> {
    return copyProps<BeforeContext<T, X>>(
      this,
      'annotations',
      'instance',
      'args',
      'target',
    );
  }

  asAfterReturnContext(): AfterReturnContext<T, X> {
    return copyProps<AfterReturnContext<T, X>>(
      this,
      'annotations',
      'instance',
      'args',
      'target',
      'value',
    );
  }

  asAfterThrowContext(): AfterThrowContext<T, X> {
    return copyProps<AfterThrowContext<T, X>>(
      this,
      'annotations',
      'instance',
      'args',
      'target',
      'error',
    );
  }

  asCompileContext(): CompileContext<T, X> {
    return copyProps<CompileContext<T, X>>(this, 'annotations', 'target');
  }

  asAroundContext(): AroundContext<T, X> {
    return copyProps<AroundContext<T, X>>(
      this,
      'annotations',
      'instance',
      'args',
      'target',
      'joinpoint',
      'value',
    );
  }
}

function copyProps<A>(ctxt: any, ...keys: (keyof A)[]) {
  return keys
    .map((prop) => ({ prop, value: ctxt[prop] }))
    .reduce((res, { prop, value }) => {
      res[prop] = value as any;
      return res;
    }, {} as A);
}
