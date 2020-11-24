import {
    AdviceContext,
    AdviceError,
    AdviceType,
    CompileAdvice,
    JoinPoint,
    MutableAdviceContext,
} from '@aspectjs/core/commons';
import { getOrComputeMetadata, isFunction, isUndefined } from '@aspectjs/core/utils';
import { _defineFunctionProperties } from '../../utils';
import { _GenericWeavingStrategy } from './generic-weaving-strategy';

type MethodPropertyDescriptor = PropertyDescriptor & { value: (...args: any[]) => any };

/**
 * @internal
 */
export class _MethodWeavingStrategy<T> extends _GenericWeavingStrategy<T, AdviceType.METHOD> {
    compile(ctxt: MutableAdviceContext<T, AdviceType.METHOD>, advices: CompileAdvice<T, AdviceType.METHOD>[]) {
        const target = ctxt.target;

        // save & restore original descriptor
        Reflect.defineProperty(
            target.proto,
            target.propertyKey,
            getOrComputeMetadata(
                'aspectjs.originalMethodDescriptor',
                target.proto,
                ctxt.target.propertyKey,
                () => {
                    return { ...Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey) };
                },
                true,
            ),
        );

        let lastCompileAdvice = advices[0];
        let newDescriptor: PropertyDescriptor;

        advices.forEach((advice) => {
            lastCompileAdvice = advice;
            ctxt.advice = advice;
            newDescriptor =
                (advice(ctxt as AdviceContext<T, AdviceType.METHOD>) as PropertyDescriptor) ?? newDescriptor;
        });
        delete ctxt.advice;

        if (isUndefined(newDescriptor)) {
            return Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey) as MethodPropertyDescriptor;
        } else {
            if (Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey)?.configurable === false) {
                throw new AdviceError(lastCompileAdvice, `${target.label} is not configurable`);
            }

            // ensure value is a function
            if (!isFunction(newDescriptor.value)) {
                throw new AdviceError(
                    lastCompileAdvice,
                    `Expected advice to return a method descriptor. Got: ${newDescriptor.value}`,
                );
            }

            if (isUndefined(newDescriptor.enumerable)) {
                newDescriptor.enumerable = false;
            }
            if (isUndefined(newDescriptor.configurable)) {
                newDescriptor.configurable = true;
            }
            // test property validity
            newDescriptor = Object.getOwnPropertyDescriptor(
                Object.defineProperty({}, 'surrogate', newDescriptor),
                'surrogate',
            );

            Reflect.defineProperty(target.proto, target.propertyKey, newDescriptor);
            return newDescriptor as MethodPropertyDescriptor;
        }
    }

    initialJoinpoint(ctxt: MutableAdviceContext<T, AdviceType.METHOD>, refDescriptor: PropertyDescriptor): void {
        ctxt.value = refDescriptor.value.apply(ctxt.instance, ctxt.args);
    }

    finalize(ctxt: MutableAdviceContext<T, AdviceType.METHOD>, jp: JoinPoint): PropertyDescriptor {
        const newDescriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(
            ctxt.target.proto,
            ctxt.target.propertyKey,
        );

        newDescriptor.value = jp;

        const originalFn = ctxt.target.proto[ctxt.target.propertyKey];
        newDescriptor.value = _defineFunctionProperties(
            newDescriptor.value,
            originalFn.name,
            originalFn.toString().split('\n')[0],
            originalFn.toString.bind(originalFn),
        );

        Reflect.defineMetadata('aspectjs.enhancedMethodDescriptor', true, newDescriptor);
        return newDescriptor;
    }
}
