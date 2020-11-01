import { AdviceType } from '../types';
import { AnnotationContext } from '../../annotation/context/annotation-context';
import { AdviceTarget } from '../target/advice-target';

export interface AfterContext<T = unknown, A extends AdviceType = any> {
    /** The annotation context **/
    readonly annotation: AnnotationContext<T, A>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance: T;
    /** the arguments originally passed to the method call **/
    readonly args: any[];
    /** The symbol targeted by this advice (class, method, property or parameter **/
    readonly target: AdviceTarget<T, A>;
    /** any data set by the advices, shared across all advice going through  this execution context **/
    readonly data: Record<string, any>;
}
