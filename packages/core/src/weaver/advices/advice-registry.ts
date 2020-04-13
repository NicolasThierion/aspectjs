import { Advice } from './types';
import { assert, getMetaOrDefault, getProto } from '../../utils';

export class AdvicesRegistry {
    static create(aspect: object, ...advices: Advice[]) {
        advices.forEach(advice => (advice.aspect = aspect));
        getMetaOrDefault('aspectjs.registry.aspect.advices', getProto(aspect), () => {
            return _recursiveGetAdvicesForAspect(aspect);
        }).push(...advices);
    }
    static getAdvicesForAspect(aspect: object): Advice[] {
        const advices = getMetaOrDefault('aspectjs.registry.aspect.advices', getProto(aspect), () => [] as Advice[]);
        assert(!!advices.length, `Aspect ${aspect.constructor.name} does not define any advice`);

        return advices;
    }
}

function _recursiveGetAdvicesForAspect(aspect: object): Advice[] {
    return getMetaOrDefault('aspectjs.registry.aspect.advices', getProto(aspect), () => {
        const parentProto = Reflect.getPrototypeOf(getProto(aspect));

        return parentProto === Object.prototype ? [] : _recursiveGetAdvicesForAspect(parentProto);
    });
}
