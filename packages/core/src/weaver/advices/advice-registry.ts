import { Advice } from './types';
import { assert, getMetaOrDefault, getProto } from '../../utils';

export class AdvicesRegistry {
    static create(aspect: object, advice: Advice) {
        getMetaOrDefault('aspectjs.registry.aspect.advices', getProto(aspect), () => []).push(advice);
    }
    static getAdvicesForAspect(aspect: object): Advice[] {
        const advices = getMetaOrDefault('aspectjs.registry.aspect.advices', getProto(aspect), () => [] as Advice[]);
        assert(!!advices.length, `Aspect ${aspect.constructor.name} does not define any advice`);

        return advices;
    }
}
