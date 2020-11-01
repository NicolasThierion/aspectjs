import { Advice, AdviceType } from './types';
import { assert, isFunction } from '@aspectjs/core/utils';
import { Pointcut, PointcutPhase } from './pointcut';
import { AdviceError } from '../weaver/errors/advice-error';
import { weaverContext } from '../weaver/weaver-context';

export class AdviceFactory {
    static create(pointcut: Pointcut): MethodDecorator {
        assert(
            !(pointcut.type === AdviceType.PROPERTY) ||
                pointcut.ref.startsWith('property#get') ||
                pointcut.ref.startsWith('property#set'),
        );

        return function (aspect: any, propertyKey: string | symbol) {
            assert(isFunction(aspect[propertyKey]));

            const advice = function (...args: any[]) {
                return aspect[propertyKey].apply(this, args);
            } as Advice;
            advice.pointcut = pointcut;
            advice.aspect = aspect;

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

            weaverContext.advicesRegistry.register(aspect, advice);
        };
    }
}
