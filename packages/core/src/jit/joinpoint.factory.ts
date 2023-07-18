import { AroundAdvice } from '../advices/around/around.type';
import { AdviceError } from '../errors/advice.error';

import type { JoinPoint } from '../advice/joinpoint';
import type { AroundContext } from './../advices/around/around.context';

import type { JoinpointType } from './../pointcut/pointcut-target.type';
export class JoinPointFactory {
  create<T extends JoinpointType = JoinpointType, X = unknown, R = unknown>(
    advice: AroundAdvice<T, X>,
    ctxt: AroundContext<T, X>,
    fn: (...args: unknown[]) => R,
  ): JoinPoint {
    function alreadyCalledFn(): never {
      throw new AdviceError(advice, ctxt.target, `joinPoint already proceeded`);
    }

    return function (...args: unknown[]) {
      const jp = fn;
      fn = alreadyCalledFn;
      return jp.apply(ctxt.instance, args);
    };
  }
}
