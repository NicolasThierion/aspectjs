import { AnnotationContext } from '../annotation/context/context';
import { AnnotationType } from '..';
import { InstanceResolver } from './instance-resolver';
import { Mutable } from '../utils';

export interface AnnotationAdviceContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: InstanceResolver<T>;
    readonly args: any[];
    readonly error: Error;
}

export type MutableAnnotationAdviceContext<T, A extends AnnotationType> = Mutable<AnnotationAdviceContext<T, A>> & {
    seal(): AnnotationAdviceContext<T, A>;
};
