import { AroundContext } from '../advice/around/around-context';
import { JoinPoint } from './types';
import { AspectError } from './errors/aspect-error';
import { isArray } from '@aspectjs/core/utils';
import { Mutable } from '../utils/utils';

export class JoinpointFactory<T> {
    // TODO ctxt = AroundContext
    static create<T>(ctxt: Mutable<AroundContext<T>>, fn: (...args: any[]) => any): JoinPoint<T> {
        function alreadyCalledFn(): void {
            throw new AspectError(ctxt, `joinPoint already proceeded`);
        }

        return function (args?: unknown[]) {
            args = args ?? ctxt.args;
            if (!isArray(args)) {
                throw new AspectError(ctxt, `Joinpoint arguments expected to be array. Got: ${args}`);
            }
            const jp = fn;
            fn = alreadyCalledFn;
            return jp.apply(ctxt.instance, args);
        };
    }
}
