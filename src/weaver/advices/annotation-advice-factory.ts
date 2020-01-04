import { Advice, Pointcut, PointcutName } from './types';
import { Annotation } from '../..';
import { assert, isFunction } from '../../utils';
import { AdvicesRegistry } from './advice-registry';

export class AnnotationAdviceFactory {
    static create(annotation: Annotation, pointcutName: PointcutName): MethodDecorator {
        return function(aspect: any, propertyKey: string | symbol) {
            assert(isFunction(aspect[propertyKey]));
            const advice = aspect[propertyKey] as Advice;
            const pointcut: Pointcut = {
                annotation: annotation,
                name: pointcutName,
            };

            advice.pointcut = pointcut;

            Reflect.defineProperty(pointcut, Symbol.toPrimitive, {
                value: () => `${pointcutName}(${annotation})`,
            });

            Reflect.defineProperty(advice, Symbol.toPrimitive, {
                value: () => `${aspect.constructor.name} {${pointcutName}(${annotation}) ${String(propertyKey)}() }`,
            });

            AdvicesRegistry.create(aspect, advice);
        };
    }
}
