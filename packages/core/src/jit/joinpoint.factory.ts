import { AroundAdvice } from '../advices/around/around.type';

import type { JoinPoint } from '../advice/joinpoint';
import type { AroundContext } from './../advices/around/around.context';

import type { PointcutType } from './../pointcut/pointcut-target.type';
export class JoinPointFactory {
  create<T extends PointcutType = PointcutType, X = unknown, R = unknown>(
    _advice: AroundAdvice<T, X>,
    ctxt: AroundContext<T, X>,
    fn: (...args: unknown[]) => R,
  ): JoinPoint {
    return function (...args: unknown[]) {
      return fn.apply(ctxt.instance, args);
    };
  }
}
