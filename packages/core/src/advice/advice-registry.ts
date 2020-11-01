import { Advice } from './types';
import { getOrComputeMetadata, getProto } from '@aspectjs/core/utils';
import { AspectType } from '../weaver/types';
import { assertIsAspect } from '../utils/utils';

let registryId = 0;

/**
 * Stores the aspects along with their advices.
 */
export class AdvicesRegistry {
    private readonly _advicesRegistryKey: string;
    // private readonly _advicesByPointcuts: Record<string, Advice[]> = {};
    constructor() {
        this._advicesRegistryKey = `aspectjs.adviceRegistry(${registryId++}).byAspects`;
    }

    /**
     * Register a new advice, with its pointcut and the aspect is belongs to.
     * @param aspect The aspect that defines the advice
     * @param advice the advices to register.
     */
    register(aspect: object, advice: Advice): void {
        const byAspectRegistry = this._getRegistry(this._advicesRegistryKey, aspect);
        const a = advice;
        const k = `${a.pointcut.ref}=>${a.name}`;
        byAspectRegistry[k] = a;

        // const pc = advice.pointcut;
        // this._advicesByPointcuts[pc.ref] = this._advicesByPointcuts[pc.ref] ?? [];
        // this._advicesByPointcuts[pc.ref].push(a);
    }

    getAdvicesByAspect(aspect: AspectType): Advice[] {
        assertIsAspect(aspect);

        return Object.values(this._getRegistry(this._advicesRegistryKey, aspect))
            .flat()
            .map((advice) => {
                const bound = advice.bind(aspect);
                Object.defineProperties(bound, Object.getOwnPropertyDescriptors(advice));
                return bound as Advice;
            });
    }

    // getAdvicesByPointcut(pc: Pointcut): Advice[] {
    //     return this._advicesByPointcuts[pc.ref] ?? [];
    // }

    private _getRegistry(registerKey: string, aspect: AspectType): Record<string, Advice> {
        const proto = getProto(aspect);

        return getOrComputeMetadata(registerKey, proto, () => {
            const parentProto = Reflect.getPrototypeOf(proto);

            return parentProto === Object.prototype ? {} : this._getRegistry(registerKey, parentProto);
        });
    }
}
