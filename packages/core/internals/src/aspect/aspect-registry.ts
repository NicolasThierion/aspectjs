import { AspectType, getWeaverContext, WeaverContext } from '../weaver';
import { assert, assertIsAspect } from '../utils/utils';
import { After, AfterReturn, AfterThrow, Around, Before, Compile, Order } from '../annotations';
import { Pointcut, PointcutExpression, PointcutPhase } from '../advice/pointcut';
import { AdviceFactory } from '../advice/advice-factory';
import { Advice, AdviceType } from '../advice/types';
import { locator } from '../utils/locator';
import { AdviceTarget } from '../annotation/target/annotation-target';

interface AdvicesRegistry {
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
    byAspect: {
        [targetRef: string]: {
            [adviceName: string]: Advice<unknown, AdviceType, PointcutPhase>;
        };
    };
}

interface AdvicesFilter {
    name: string;
    fn: (a: Advice) => boolean;
}

/**
 * Stores the aspects along with their advices.
 * @public
 */
export class AspectsRegistry {
    private readonly _advicesRegistryKey: string;
    private _advicesRegistry: AdvicesRegistry = {
        byPointcut: {},
        byTarget: {},
        byAspect: {},
    };
    private _dirty = true;
    private readonly _aspectsToLoad: Set<AspectType> = new Set<AspectType>();
    private readonly _loadedAspects: Set<AspectType> = new Set<AspectType>();

    // private readonly _advicesByPointcuts: Record<string, Advice[]> = {};
    constructor(private _weaverContext: WeaverContext) {
        this._advicesRegistryKey = `aspectjs.adviceRegistry.byAspects`; // TODO increment key with AspectsRegistry instance ?
    }

    /**
     * Register a new advice, with the aspect is belongs to.
     * @param aspects - The aspects to register
     */
    register(...aspects: AspectType[]): void {
        (aspects ?? []).forEach((aspect) => {
            this._aspectsToLoad.add(aspect);
            const target = this._getTarget(aspect);

            const byAspectRegistry = locator(this._advicesRegistry.byAspect)
                .at(target.ref)
                .orElseCompute(() => ({}));

            const l = getWeaverContext().annotations.location;
            const bundle = getWeaverContext().annotations.bundle.at(l.of(aspect));
            [
                [Compile, PointcutPhase.COMPILE],
                [Before, PointcutPhase.BEFORE],
                [Around, PointcutPhase.AROUND],
                [After, PointcutPhase.AFTER],
                [AfterReturn, PointcutPhase.AFTERRETURN],
                [AfterThrow, PointcutPhase.AFTERTHROW],
            ].forEach((adviceDef) => {
                // TODO use .map().flat()
                bundle.onMethod(adviceDef[0]).forEach((annotation) => {
                    const expr = annotation.args[0] as PointcutExpression;
                    assert(!!expr);

                    const advice = AdviceFactory.create(
                        Pointcut.of(adviceDef[1] as PointcutPhase, expr),
                        annotation.target,
                    );
                    const k = `${advice.pointcut.ref}=>${advice.name}`;
                    byAspectRegistry[k] = advice;
                });
            });
        });
    }

    remove(...aspects: AspectType[]): void {
        this._dirty = true;
        if (this._aspectsToLoad.size) {
            aspects.forEach((a) => {
                // remove aspect from the list of aspects to load
                this._aspectsToLoad.delete(a);

                // remove aspect from registry
                delete this._advicesRegistry.byAspect[this._getTarget(a).ref];
            });
        }

        // force all aspects to reload
        this._loadedAspects.forEach((a) => this._aspectsToLoad.add(a));
        this._loadedAspects.clear();
    }

    /**
     * Get all advices that belongs to the given aspect
     * @param aspect - the aspect to get advices for.
     */
    getAdvicesByAspect(aspect: AspectType): Advice[] {
        assertIsAspect(aspect);
        const target = this._getTarget(aspect);

        return Object.values(this._advicesRegistry.byAspect[target.ref] ?? {})
            .flat()
            .map((advice) => {
                const bound = advice.bind(aspect);
                Object.defineProperties(bound, Object.getOwnPropertyDescriptors(advice));
                return bound as Advice;
            });
    }

    getAdvicesByTarget<T, A extends AdviceType, P extends PointcutPhase>(
        target: AdviceTarget<T, A>,
        filter?: AdvicesFilter,
        ...phases: PointcutPhase[]
    ): AdvicesRegistry['byTarget'][string] {
        this._load();

        const targetRegistry = locator(this._advicesRegistry)
            .at('byTarget')
            .at(`${target.ref}${filter?.name ? `:${filter?.name}` : ''}`)
            .orElseGet(() => ({}));

        // get all advices that correspond to all the annotations of this context
        const bundle = this._weaverContext.annotations.bundle.at(target.location);
        const annotationContexts = bundle.all();

        (phases ?? []).forEach((phase) => {
            if (!targetRegistry[phase]) {
                let annotations = annotationContexts
                    .map((annotationContext) =>
                        locator(this._advicesRegistry)
                            .at('byPointcut')
                            .at(phase)
                            .at(target.type)
                            .at('byAnnotation')
                            .at(annotationContext.ref)
                            .orElseGet(() => [] as any),
                    )
                    .flat()
                    .sort((a1: Advice, a2: Advice) => {
                        // sort by advice order
                        const a = this._weaverContext.annotations;
                        const o1 = a.bundle.at(a.location.of(a1.aspect as any)[a1.name]).onMethod(Order)[0]?.args[0];
                        const o2 = a.bundle.at(a.location.of(a2.aspect as any)[a1.name]).onMethod(Order)[0]?.args[0];

                        return _compareOrder(o1, o2);
                    });

                if (filter) {
                    annotations = annotations.filter(filter.fn);
                }
                (targetRegistry as any)[phase] = annotations;
            }
        });
        return targetRegistry;
    }
    /**
     * @internal
     */
    private _getTarget<T>(obj: T): AdviceTarget<T> {
        return this._weaverContext.annotations.targetFactory.getTarget(
            this._weaverContext.annotations.location.of(obj),
        );
    }

    /**
     * Sort the aspects according to their precedence & store by target, by phase & type
     * @private
     */
    private _load() {
        if (this._dirty) {
            this._advicesRegistry.byPointcut = {};
            this._advicesRegistry.byTarget = {};
        }

        [...this._aspectsToLoad]
            .sort((a1: any, a2: any) => {
                // sort by aspect order
                const a = this._weaverContext.annotations;
                const o1 = a.bundle.at(a.location.of(a1)).onClass(Order)[0]?.args[0];
                const o2 = a.bundle.at(a.location.of(a2)).onClass(Order)[0]?.args[0];

                return _compareOrder(o1, o2);
            })
            .map((a) => {
                this._loadedAspects.add(a);
                return a;
            })
            .map((aspect: AspectType) => this.getAdvicesByAspect(aspect))
            .flat()
            .forEach((advice: Advice) => {
                const pc = advice.pointcut;
                locator(this._advicesRegistry)
                    .at('byPointcut')
                    .at(pc.phase)
                    .at(pc.type)
                    .at('byAnnotation')
                    .at(pc.annotation.ref)
                    .orElseCompute(() => [])
                    .push(advice);
            });
        this._dirty = false;
        this._aspectsToLoad.clear();
    }
}

function _compareOrder(o1: any, o2: any) {
    if (o1 === Order.LOWEST_PRECEDENCE || o1 === undefined) {
        return 1;
    }

    if (o2 === Order.LOWEST_PRECEDENCE || o2 === undefined) {
        return -1;
    }

    if (o1 === Order.HIGHEST_PRECEDENCE) {
        return -1;
    }

    if (o2 === Order.HIGHEST_PRECEDENCE) {
        return 1;
    }
    return o1 - o2;
}
