import { MutableAdviceContext } from '../../advice/advice-context';
import { Advice, AdviceType, CompileAdvice } from '../../advice/types';
import { AspectType } from '../types';
import { getAspectOptions } from '../../utils/utils';
import { AspectOptions } from '../../advice/aspect';
import { WEAVER_CONTEXT } from '../weaver-context';
import { PointcutPhase } from '../../advice/pointcut';
import { AdviceTarget } from '../../annotation/target/annotation-target';
import { WeaverHooks } from '../weaver-hooks';
import { JoinpointFactory } from '../joinpoint-factory';
import { WeavingError } from '../errors/weaving-error';
import { locator } from '../../utils/locator';
import { assert } from '@aspectjs/core/utils';

interface AdvicesExecutionRegistry {
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

interface AdvicesExecutionFilter {
    name: string;
    fn: (a: Advice) => boolean;
}

type AdvicesLoader = (
    target: AdviceTarget,
    save: boolean,
    ...phases: PointcutPhase[]
) => AdvicesExecutionRegistry['byTarget'][string];
export class AdviceExecutionPlanFactory {
    private readonly _aspects: Set<AspectType> = new Set<AspectType>();
    private readonly _loadedAspects: Set<AspectType> = new Set<AspectType>();
    private _dirty = true;
    private _advices: AdvicesExecutionRegistry;

    constructor(...aspects: AspectType[]) {
        this.enable(...aspects);
    }

    create<T, A extends AdviceType = any>(
        target: AdviceTarget<T, A>,
        hooks: WeaverHooks<T, A>,
        filter?: {
            name: string;
            fn: (a: Advice) => boolean;
        },
    ): ExecutionPlan<T, A> {
        const advicesLoader: AdvicesLoader = (target: AdviceTarget, save: boolean, ...phases: PointcutPhase[]) => {
            return this._getAdvices(target, filter, save, ...phases);
        };

        return new ExecutionPlan<T, A>(hooks, advicesLoader);
    }

    disable(...aspects: AspectType[]): void {
        this._dirty = true;
        if (this._aspects.size) {
            aspects.forEach((a) => this._aspects.delete(a));
        }

        // force reload all aspects
        this._loadedAspects.forEach((a) => this._aspects.add(a));
        this._loadedAspects.clear();
    }

    enable(...aspects: AspectType[]): void {
        aspects.forEach((a) => this._aspects.add(a));
    }

    /**
     * Sort the aspects according to their precedence & store by phase & type
     * @private
     */
    private _load() {
        if (this._dirty) {
            // TODO incremental loading
            this._advices = {
                byPointcut: {},
                byTarget: {},
            };
        }

        [...this._aspects]
            .sort((a1: any, a2: any) => {
                // sort by aspect priority
                const [o1, o2] = [getAspectOptions(a1), getAspectOptions(a2)] as AspectOptions[];
                const [p1, p2] = [o1?.priority ?? 0, o2?.priority ?? 0];

                return p2 - p1;
            })
            .map((a) => {
                this._loadedAspects.add(a);
                return a;
            })
            .map((aspect: AspectType) => WEAVER_CONTEXT.advices.registry.getAdvicesByAspect(aspect))
            .flat()
            .forEach((advice: Advice) => {
                const pc = advice.pointcut;
                locator(this._advices)
                    .at('byPointcut')
                    .at(pc.phase)
                    .at(pc.type)
                    .at('byAnnotation')
                    .at(pc.annotation.ref)
                    .orElseCompute(() => [])
                    .push(advice);
            });
        this._dirty = false;
        this._aspects.clear();
    }

    private _getAdvices<T, A extends AdviceType, P extends PointcutPhase>(
        target: AdviceTarget<T, A>,
        filter: AdvicesExecutionFilter,
        save: boolean,
        ...phases: PointcutPhase[]
    ): AdvicesExecutionRegistry['byTarget'][string] {
        this._load();

        return locator(this._advices)
            .at('byTarget')
            .at(`${target.ref}${filter?.name ? `:${filter?.name}` : ''}`)
            .orElse(() => {
                // get all advices that correspond to all the annotations of this context
                const bundle = WEAVER_CONTEXT.annotations.bundle.at(target.location);
                const annotationContexts = bundle.all();

                return (phases ?? []).reduce((reg, phase) => {
                    let annotations = annotationContexts
                        .map((annotationContext) =>
                            locator(this._advices)
                                .at('byPointcut')
                                .at(phase)
                                .at(target.type)
                                .at('byAnnotation')
                                .at(annotationContext.ref)
                                .orElseGet(() => [] as any),
                        )
                        .flat()
                        .sort((a1: Advice, a2: Advice) => {
                            const [p1, p2] = [a1.pointcut.options.priority, a2.pointcut.options.priority];
                            return !p2 && !p2 ? 0 : p2 - p1;
                        });

                    if (filter) {
                        annotations = annotations.filter(filter.fn);
                    }
                    (reg as any)[phase] = annotations;
                    return reg;
                }, {} as AdvicesExecutionRegistry['byTarget'][string]);
            }, save);
    }
}

/**
 * Sort the advices according to their precedence & store by phase & type, so they are ready to execute.
 */
export class ExecutionPlan<T = unknown, A extends AdviceType = any> {
    private _compiled = false;
    private originalSymbol: A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;

    constructor(private _hooks: WeaverHooks<T, A>, private _advicesLoader: AdvicesLoader) {}

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
                true,
                PointcutPhase.BEFORE,
                PointcutPhase.AROUND,
                PointcutPhase.AFTERRETURN,
                PointcutPhase.AFTERTHROW,
                PointcutPhase.AFTER,
            );

            // create the joinpoint for the original method
            const jp = JoinpointFactory.create(ctxt, (...args: any[]) => {
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
        const compileAdvices = this._advicesLoader(ctxt.target, false, PointcutPhase.COMPILE)[PointcutPhase.COMPILE];
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
