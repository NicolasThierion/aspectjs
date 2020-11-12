import { Advice, AdviceType } from './types';
import { Pointcut, PointcutPhase } from '../types';
import { AdviceError } from '../weaver/errors';
import { assert, getProto, isFunction } from '@aspectjs/core/utils';
import { getWeaverContext } from '../weaver';
import { AdviceTarget } from '../annotation/target/annotation-target';

/**
 * @internal
 */
export class AdviceFactory {
    static create(pointcut: Pointcut, target: AdviceTarget): Advice {
        assert(
            !(pointcut.type === AdviceType.PROPERTY) ||
                pointcut.ref.startsWith('property#get') ||
                pointcut.ref.startsWith('property#set'),
        );
        const [aspect, propertyKey] = [target.proto, target.propertyKey];

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

        // assert the weaver is loaded before invoking the underlying decorator
        const weaverContext = getWeaverContext();
        if (!weaverContext) {
            throw new Error(
                `Cannot create aspect ${
                    getProto(aspect).constructor.name ?? ''
                } before "setWeaverContext()" has been called`,
            );
        }

        return advice;
    }
}
