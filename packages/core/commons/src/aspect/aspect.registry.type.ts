/**
 * Stores the aspects along with their advices.
 * @public
 */
import { AspectType } from './aspect.type';
import { Advice, AdviceType } from '../advices/types';
import { PointcutPhase } from '../types';
import { AdviceTarget } from '../annotation/target/annotation-target';

export interface AdvicesRegistry {
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

export interface AdvicesFilter {
    name: string;
    fn: (a: Advice) => boolean;
}

export interface AspectsRegistry {
    /**
     * Register a new advice, with the aspect is belongs to.
     * @param aspects - The aspects to register
     */
    register(...aspects: AspectType[]): void;

    remove(...aspects: AspectType[]): void;

    /**
     * Get all advices that belongs to the given aspect
     * @param aspect - the aspect to get advices for.
     */
    getAdvicesByAspect(aspect: AspectType): Advice[];

    getAdvicesByTarget<T, A extends AdviceType, P extends PointcutPhase>(
        target: AdviceTarget<T, A>,
        filter?: AdvicesFilter,
        ...phases: PointcutPhase[]
    ): AdvicesRegistry['byTarget'][string];
}
