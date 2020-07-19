import { Advice } from './types';
import { assert, isFunction } from '../utils';
import { AdvicesRegistry } from './advice-registry';
import { Pointcut, PointcutPhase } from './pointcut';
import { AnnotationType } from '../annotation/annotation.types';
import { AdviceError } from '../weaver/errors/advice-error';

export class AdviceFactory {
    static create(pointcut: Pointcut): MethodDecorator {
        assert(
            !(pointcut.type === AnnotationType.PROPERTY) ||
                pointcut.ref.startsWith('property#get') ||
                pointcut.ref.startsWith('property#set'),
        );

        return function (aspect: any, propertyKey: string | symbol) {
            assert(isFunction(aspect[propertyKey]));

            const advice = function (...args: any[]) {
                return aspect[propertyKey].bind(this)(...args);
            } as Advice;
            advice.pointcut = pointcut;

            Reflect.defineProperty(advice, Symbol.toPrimitive, {
                value: () =>
                    `@${pointcut.phase}(${pointcut.annotation}) ${aspect.constructor.name}.${String(propertyKey)}()`,
            });

            Reflect.defineProperty(advice, 'name', {
                value: propertyKey,
            });

            if (pointcut.ref.startsWith('property#set') && pointcut.phase === PointcutPhase.COMPILE) {
                throw new AdviceError(advice, `Advice cannot be applied on property setter`);
            }

            AdvicesRegistry.create(aspect, advice);
        };
    }
}
