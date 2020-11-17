import { assert } from '@aspectjs/core/utils';
import {
    PointcutPhase,
    AdviceTarget,
    WeaverContext,
    _WeaverHooks,
    _JoinpointFactory,
    WeavingError,
    Advice,
    AdviceType,
    CompileAdvice,
    MutableAdviceContext,
} from '@aspectjs/core/commons';

/**
 * @internal
 */
export interface _AdvicesExecutionRegistry {
    byPointcut: {
        [phase in PointcutPhase]?: {
            [type in AdviceType]?: {
                byAnnotation: {
                    [annotationRef: string]: Advice<unknown, type, phase>[];
                };
            };
        };
    };
    byTarget: {
        [targetRef: string]: {
            [phase in PointcutPhase]?: Advice<unknown, AdviceType, phase>[];
        };
    };
}

/**
 * @internal
 */
export type _AdvicesLoader = (
    target: AdviceTarget,
    ...phases: PointcutPhase[]
) => _AdvicesExecutionRegistry['byTarget'][string];

/**
 * @internal
 */
export class _AdviceExecutionPlanFactory {
    constructor(private _context: WeaverContext) {}

    create<T, A extends AdviceType = any>(
        target: AdviceTarget<T, A>,
        hooks: _WeaverHooks<T, A>,
        filter?: {
            name: string;
            fn: (a: Advice) => boolean;
        },
    ): _ExecutionPlan<T, A> {
        const advicesLoader: _AdvicesLoader = (target: AdviceTarget, ...phases: PointcutPhase[]) => {
            return this._context.aspects.registry.getAdvicesByTarget(target, filter, ...phases);
        };

        return new _ExecutionPlan<T, A>(hooks, advicesLoader);
    }
}

/**
 * Sort the advices according to their precedence & store by phase & type, so they are ready to execute.
 * @internal
 */
export class _ExecutionPlan<T = unknown, A extends AdviceType = any> {
    private _compiled = false;
    private originalSymbol: A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;

    constructor(private _hooks: _WeaverHooks<T, A>, private _advicesLoader: _AdvicesLoader) {}

    /**
     * Returns a function that executes the  execution plan for the Before, Around, AfterReturn, AfterThrow & After advices.
     */
    link<C extends MutableAdviceContext<T, A>>(ctxt: C): (...args: any[]) => T {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const plan = this;
        const hooks = this._hooks;
        if (!this._compiled) {
            this.compile(ctxt);
        }
        assert(!!this.originalSymbol);

        return function (...args: any[]): T {
            ctxt.args = args;
            ctxt.instance = this;
            const advicesReg = plan._advicesLoader(
                ctxt.target,
                PointcutPhase.BEFORE,
                PointcutPhase.AROUND,
                PointcutPhase.AFTERRETURN,
                PointcutPhase.AFTERTHROW,
                PointcutPhase.AFTER,
            );

            // create the joinpoint for the original method
            const jp = _JoinpointFactory.create(null, ctxt, (...args: any[]) => {
                const restoreJp = ctxt.joinpoint;
                const restoreArgs = ctxt.args;
                ctxt.args = args;
                delete ctxt.joinpoint;

                try {
                    hooks.preBefore?.call(hooks, ctxt);
                    hooks.before(ctxt, advicesReg[PointcutPhase.BEFORE] as Advice<T, A, PointcutPhase.BEFORE>[]);

                    hooks.initialJoinpoint.call(hooks, ctxt, plan.originalSymbol);

                    hooks.preAfterReturn?.call(hooks, ctxt);
                    return hooks.afterReturn(
                        ctxt,
                        advicesReg[PointcutPhase.AFTERRETURN] as Advice<T, A, PointcutPhase.AFTERRETURN>[],
                    );
                } catch (e) {
                    // consider WeavingErrors as not recoverable by an aspect
                    if (e instanceof WeavingError) {
                        throw e;
                    }
                    ctxt.error = e;

                    hooks.preAfterThrow?.call(hooks, ctxt);
                    return hooks.afterThrow(
                        ctxt,
                        advicesReg[PointcutPhase.AFTERTHROW] as Advice<T, A, PointcutPhase.AFTERTHROW>[],
                    );
                } finally {
                    delete ctxt.error;
                    hooks.preAfter?.call(hooks, ctxt);
                    hooks.after(ctxt, advicesReg[PointcutPhase.AFTER] as Advice<T, A, PointcutPhase.AFTER>[]);
                    ctxt.joinpoint = restoreJp;
                    ctxt.args = restoreArgs;
                }
            });

            hooks.preAround?.call(hooks, ctxt);
            return hooks.around(
                ctxt,
                advicesReg[PointcutPhase.AROUND] as Advice<T, A, PointcutPhase.AROUND>[],
                jp,
            )(args);
        };
    }

    compile(
        ctxt: MutableAdviceContext<T, A>,
    ): A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor {
        const compileAdvices = this._advicesLoader(ctxt.target, PointcutPhase.COMPILE)[PointcutPhase.COMPILE];
        this.originalSymbol = this._hooks.compile(ctxt, compileAdvices as CompileAdvice<T, A>[]);
        this._compiled = true;
        if (!this.originalSymbol) {
            throw new WeavingError(
                `${Reflect.getPrototypeOf(this._hooks).constructor.name}.compile() did not returned a symbol`,
            );
        }
        return this.originalSymbol;
    }
}
