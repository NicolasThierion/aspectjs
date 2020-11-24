import {
    _JoinpointFactory,
    AdviceType,
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AnnotationType,
    AroundAdvice,
    JoinPoint,
    MutableAdviceContext,
} from '@aspectjs/core/commons';
import { assert, isFunction } from '@aspectjs/core/utils';
import { _GenericWeavingStrategy } from './generic-weaving-strategy';
import { _PropertyGetWeavingStrategy } from './property-get-weaving-strategy';

/**
 * @internal
 */
export class _PropertySetWeavingStrategy<T> extends _GenericWeavingStrategy<T, AdviceType.PROPERTY> {
    private compiledDescriptor: PropertyDescriptor;

    constructor(private getterHooks: _PropertyGetWeavingStrategy<T>) {
        super();
    }

    compile(
        ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>,
    ): AdviceType.PROPERTY extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor {
        return (this.compiledDescriptor = this.getterHooks.compile(ctxt, null));
    }

    initialJoinpoint(ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>, refDescriptor: PropertyDescriptor): void {
        assert(isFunction(refDescriptor?.set));
        ctxt.value = _JoinpointFactory.create(null, ctxt, refDescriptor.set)(ctxt.args);
    }

    around(
        ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>,
        advices: AroundAdvice<T, AdviceType.PROPERTY>[],
        jp: JoinPoint<T>,
    ): JoinPoint<T> {
        return super.around(ctxt, advices, jp, false);
    }

    afterReturn(
        ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>,
        advices: AfterReturnAdvice<T, AdviceType.PROPERTY>[],
    ): any {
        return this._applyNonReturningAdvices(ctxt, advices);
    }

    afterThrow(
        ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>,
        advices: AfterThrowAdvice<T, AdviceType.PROPERTY>[],
    ): any {
        super.afterThrow(ctxt, advices, false);
    }

    after(ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>, advices: AfterAdvice<T, AdviceType.PROPERTY>[]): void {
        this._applyNonReturningAdvices(ctxt, advices);
    }

    finalize(
        ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
        joinpoint: (...args: any[]) => T,
    ): AnnotationType.PROPERTY extends AnnotationType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor {
        const newDescriptor = {
            ...this.compiledDescriptor,
            set: joinpoint,
        };

        // test property validity
        Object.getOwnPropertyDescriptor(Object.defineProperty({}, 'surrogate', newDescriptor), 'surrogate');

        return newDescriptor;
    }
}
