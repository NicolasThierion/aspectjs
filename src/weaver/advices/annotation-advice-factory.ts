import { Advice, PointcutName } from './types';
import { Annotation } from '../..';
import { assert, isFunction } from '../../utils';
import { AdvicesRegistry } from './advice-registry';

export class AnnotationAdviceFactory {
    static create(annotation: Annotation, pointcut: PointcutName): MethodDecorator {
        return function(target: any, propertyKey: string | symbol) {
            assert(isFunction(target[propertyKey]));
            const advice = target[propertyKey] as Advice;
            advice.pointcut = {
                annotation: annotation,
                name: pointcut,
            };

            AdvicesRegistry.create(target, advice);
        };
    }
}
