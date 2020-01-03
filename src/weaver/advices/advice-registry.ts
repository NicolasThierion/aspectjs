import { Advice } from './types';
import { Aspect } from '../types';
import { assert, getMetaOrDefault, getProto } from '../../utils';
export class AdvicesRegistry {
    static create(aspect: Aspect, advice: Advice) {
        Reflect.defineProperty(advice, Symbol.toPrimitive, {
            value: () => `before ${advice.pointcut.annotation}`,
        });

        getMetaOrDefault('aspectjs.advices', getProto(aspect), () => []).push(advice);
    }
    static getAdvices(aspect: Aspect): Advice[] {
        const advices = getMetaOrDefault('aspectjs.advices', getProto(aspect), () => [] as Advice[]);
        assert(!!advices.length, `Aspect ${aspect.constructor.name} does not define any advice`);

        return advices;
    }
}
