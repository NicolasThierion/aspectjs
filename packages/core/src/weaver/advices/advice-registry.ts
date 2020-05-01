import { Advice } from './types';
import { assert, getMetaOrDefault, getProto } from '../../utils';

const ADVICES_KEY = 'aspectjs.registry.aspect.advices';
const ADVICES_REGISTRY_KEY = 'aspectjs.registry.aspect.advices.registry';

export class AdvicesRegistry {
    static create(aspect: object, ...advices: Advice[]) {
        const advicesRegistry = getMetaOrDefault(ADVICES_REGISTRY_KEY, getProto(aspect), () =>
            _recursiveGetAdvicesForAspect(aspect),
        );

        advices.reduce((advices, a) => {
            advices[`${a.pointcut.ref}=>${a.name}`] = a;
            a.aspect = aspect;
            return advices;
        }, advicesRegistry);
    }
    static getAdvicesForAspect(aspect: object): Advice[] {
        return getMetaOrDefault(ADVICES_KEY, getProto(aspect), () => {
            const advices = _recursiveGetAdvicesForAspect(aspect);
            assert(!!Object.values(advices).length, `Aspect ${aspect.constructor.name} does not define any advice`);

            return Object.values(advices);
        });
    }
}

function _recursiveGetAdvicesForAspect(aspect: object): Record<string, Advice> {
    return getMetaOrDefault(ADVICES_REGISTRY_KEY, getProto(aspect), () => {
        const parentProto = Reflect.getPrototypeOf(getProto(aspect));

        return parentProto === Object.prototype ? {} : _recursiveGetAdvicesForAspect(parentProto);
    });
}
