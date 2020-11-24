import { Advice, AnnotationsBundle } from '../../annotation/bundle/bundle';
import { AdviceTarget } from '../../annotation/target/annotation-target';
import { AdviceType } from '../types';

/**
 * @public
 */
export interface AfterThrowContext<T = unknown, A extends AdviceType = any> {
    /** The applied advice **/
    readonly advice: Advice<T, A>;
    /** The annotation contexts **/
    readonly annotations: AnnotationsBundle<T>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance: T;
    /** the arguments originally passed to the method call **/
    readonly args: any[];
    /** The error originally thrown by the method **/
    readonly error: Error;
    /** The value originally returned by the method **/
    readonly value: any;
    /** The symbol targeted by this advice (class, method, property or parameter **/
    readonly target: AdviceTarget<T, A>;
    /** any data set by the advices, shared across all advice going through  this execution context **/
    readonly data: Record<string, any>;
}
