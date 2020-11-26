import { Advice, AnnotationsBundle } from '@aspectjs/core/commons';
import { AdviceTarget } from '../../annotation/target/annotation-target';
import { AdviceType } from '../types';

/**
 * @public
 */
export interface BeforeContext<T = unknown, A extends AdviceType = any> {
    /** The applied advice **/
    readonly advice: Advice<T, A>;
    /** The annotation contexts **/
    readonly annotations: AnnotationsBundle<T>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance: A extends AdviceType.CLASS ? never : T;
    /** the arguments originally passed to the joinpoint **/
    readonly args: any[];
    /** The symbol targeted by this advice (class, method, property or parameter **/
    readonly target: AdviceTarget<T, A>;
    /** any data set by the advices, shared across all advice going through this execution context **/
    readonly data: Record<string, any>;
}
