import {
    _JoinpointFactory,
    AdviceContext,
    AdviceType,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AroundAdvice,
    AroundContext,
    CompileAdvice,
    JoinPoint,
    MutableAdviceContext,
} from '@aspectjs/core/commons';
import { _getReferenceConstructor, _setReferenceConstructor, assert, isUndefined, Mutable } from '@aspectjs/core/utils';
import { _defineFunctionProperties } from '../../utils';
import { _GenericWeavingStrategy } from './generic-weaving-strategy';

/**
 * @internal
 */
export class _ClassWeavingStrategy<T> extends _GenericWeavingStrategy<T, AdviceType.CLASS> {
    private originalInstance: T;

    compile(
        ctxt: MutableAdviceContext<T, AdviceType.CLASS>,
        advices: CompileAdvice<T, AdviceType.CLASS>[],
    ): AdviceType.CLASS extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor {
        // if another @Compile advice has been applied
        // replace wrapped ctor by original ctor before it gets wrapped again
        ctxt.target.proto.constructor = _getReferenceConstructor(ctxt.target.proto);
        _setReferenceConstructor(ctxt.target.proto, ctxt.target.proto.constructor);

        let ctor: new (...args: any[]) => T;
        advices.forEach((advice: CompileAdvice<T, AdviceType.CLASS>) => {
            ctxt.advice = advice;
            ctor = advice(ctxt as AdviceContext<T, AdviceType.CLASS>) as any;
        });
        delete ctxt.advice;
        return (ctxt.target.proto.constructor = ctor ?? ctxt.target.proto.constructor);
    }

    preAround(ctxt: MutableAdviceContext<T, AdviceType.CLASS>) {
        // original ctor invocation will discard any changes done to instance before, so accessing ctxt.instance is forbidden
        this.originalInstance = ctxt.instance;
        ctxt.instance = null;
    }

    around(
        ctxt: Mutable<AroundContext<T, AdviceType.CLASS>>,
        advices: AroundAdvice<T, AdviceType.CLASS>[],
        joinpoint: JoinPoint<T>,
    ): (args?: any[]) => any {
        advices.reverse().forEach((advice) => {
            const originalJp = joinpoint;
            const nextJp = _JoinpointFactory.create(advice, ctxt, (...args: unknown[]) => originalJp(args));
            joinpoint = (args: any[]) => {
                ctxt.joinpoint = nextJp;
                ctxt.args = args;
                ctxt.advice = advice;
                return (ctxt.instance = advice(ctxt as any, nextJp, args) ?? ctxt.instance);
            };
        });

        return joinpoint;
    }

    initialJoinpoint(ctxt: MutableAdviceContext<T, AdviceType.CLASS>, originalCtor: { new (...args: any[]): T }): void {
        // We need to keep originalInstance as the instance, because of instanceof.
        // Merge the new instance into originalInstance;
        Object.assign(this.originalInstance, new originalCtor(...ctxt.args) ?? this.originalInstance);
        ctxt.instance = this.originalInstance;
    }

    afterReturn<T>(
        ctxt: MutableAdviceContext<T, AdviceType.CLASS>,
        advices: AfterReturnAdvice<T, AdviceType.CLASS>[],
    ): T {
        let newInstance = ctxt.instance;

        advices.forEach((advice) => {
            ctxt.value = ctxt.instance;
            ctxt.advice = advice;
            newInstance = advice(ctxt, ctxt.value);
            if (!isUndefined(newInstance)) {
                ctxt.instance = newInstance;
            }
            delete ctxt.advice;
        });

        return ctxt.instance;
    }

    preAfterThrow(ctxt: MutableAdviceContext<T, AdviceType.CLASS>): void {
        // as of ES6 classes, 'this' is no more available after ctor thrown.
        // replace 'this' with partial this
        ctxt.instance = this.originalInstance;
    }

    afterThrow(ctxt: MutableAdviceContext<T, AdviceType.CLASS>, advices: AfterThrowAdvice<T, AdviceType.CLASS>[]): T {
        if (!advices.length) {
            // pass-trough errors by default
            throw ctxt.error;
        } else {
            let newInstance = ctxt.instance;
            advices.forEach((advice) => {
                ctxt.advice = advice;
                newInstance = advice(ctxt, ctxt.error);
                if (!isUndefined(newInstance)) {
                    ctxt.instance = newInstance;
                }
                delete ctxt.advice;
            });
            return ctxt.instance;
        }
    }

    finalize(
        ctxt: MutableAdviceContext<T, AdviceType.CLASS>,
        joinpoint: (...args: any[]) => T,
    ): new (...args: any[]) => T {
        assert(!!ctxt.target?.proto);
        const originalCtor = ctxt.target.proto.constructor;
        const ctorName = originalCtor.name;

        joinpoint = _defineFunctionProperties(
            joinpoint,
            ctorName,
            `class ${ctorName}$$advised {}`,
            originalCtor.toString.bind(originalCtor),
        );
        joinpoint.prototype = ctxt.target.proto;
        joinpoint.prototype.constructor = joinpoint;

        return joinpoint as any;
    }
}
