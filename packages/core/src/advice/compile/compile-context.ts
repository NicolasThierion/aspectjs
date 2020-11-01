import { AdviceType } from '../types';
import { AnnotationContext } from '../../annotation/context/annotation-context';
import { AdviceTarget } from '../../annotation/target/annotation-target';

export interface CompileContext<T = unknown, A extends AdviceType = any> {
    /** The annotation context **/
    readonly annotation: AnnotationContext<T, A>;
    /** The symbol targeted by this advice (class, method, property or parameter **/
    readonly target: AdviceTarget<T, A>;
    /** any data set by the advices, shared across all advice going through  this execution context **/
    readonly data: Record<string, any>;
}
