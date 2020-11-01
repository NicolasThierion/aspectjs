import { AnnotationTarget } from '../../advice/target/advice-target';
import { AnnotationType } from '../annotation.types';

export class AnnotationRegistry {
    register<A extends AnnotationType>(target: AnnotationTarget<any, A>) {}
}
