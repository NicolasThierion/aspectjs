import { Advice, AdviceType, CompileAdvice } from './types';
import { Pointcut, PointcutPhase } from '../types';
import { AdviceError, WeavingError } from '../weaver/errors';
import { assert, getProto, isFunction } from '@aspectjs/core/utils';
import { _getWeaverContext } from '../weaver';
import { AdviceTarget } from '../annotation/target/annotation-target';

/**
 * @internal
 */
export class _AdviceFactory {
    static create(pointcut: Pointcut, target: AdviceTarget): Advice {
        assert(
            !(pointcut.type === AdviceType.PROPERTY) ||
                pointcut.ref.startsWith('property#get') ||
                pointcut.ref.startsWith('property#set'),
        );
        const [aspect, propertyKey] = [target.proto, target.propertyKey];

        assert(isFunction(aspect[propertyKey]));
        let advice: Advice;
        if (pointcut.phase === PointcutPhase.COMPILE) {
            // prevent @Compile advices to be called twice
            advice = function (...args: any[]) {
                const a = advice as CompileAdvice;
                advice = (() => {
                    throw new WeavingError(`${a} already applied`);
                }) as any;

                return aspect[propertyKey].apply(this, args);
            } as Advice;
        } else {
            advice = function (...args: any[]) {
                return aspect[propertyKey].apply(this, args);
            } as Advice;
        }

        advice.pointcut = pointcut;
        advice.aspect = aspect;

        Reflect.defineProperty(advice, Symbol.toPrimitive, {
            value: () =>
                `@${pointcut.phase}(${pointcut.annotation}) ${aspect.constructor.name}.${String(propertyKey)}()`,
        });

        Reflect.defineProperty(advice, 'name', {
            value: propertyKey,
        });

        if (pointcut.phase === PointcutPhase.COMPILE) {
            if (pointcut.ref.startsWith('property#set')) {
                // @Compile(on.property.setter) are forbidden
                // because PropertyDescriptor can only be setup for both setter & getter at once.
                throw new AdviceError(advice, `Advice cannot be applied on property setter`);
            }
        }

        // assert the weaver is loaded before invoking the underlying decorator
        const weaverContext = _getWeaverContext();
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
