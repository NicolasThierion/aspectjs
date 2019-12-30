import { WeaverProfile } from '../profile';
import { getOrDefault } from '../../utils';
import { Advice, Aspect, MethodPointCutHooks, POINTCUT_NAMES } from '../types';
import { WeavingError } from '../weaving-error';

type AdviceRegistry = { [k in keyof MethodPointCutHooks]?: Advice<any>[] };

export class Weaver extends WeaverProfile {
    private _advices: AdviceRegistry;
    constructor(name?: string) {
        super(name);
    }

    enable(...aspects: Aspect[]): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot enable or disable aspects`);
        return super.enable(...aspects);
    }
    disable(...aspects: Aspect[]): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot enable or disable aspects`);
        return super.disable(...aspects);
    }
    merge(...profiles: WeaverProfile[]): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot change profile`);
        return super.merge(...profiles);
    }
    setProfile(profile: WeaverProfile): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot change profile`);
        return super.reset().merge(profile);
    }
    load(): void {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded`);
        this._advices = POINTCUT_NAMES.reduce((acc, c) => {
            acc[c] = [];
            return acc;
        }, {} as AdviceRegistry);

        this._advices = Object.values(this._aspects)
            .map(Object.values)
            .flat()
            .reduce((acc, c) => {
                Object.entries(c).forEach(e => {
                    getOrDefault(acc, e[0], () => []).push((e[1] as any).advice);
                });
                return acc;
            }, this._advices);
    }

    reset(): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot reset change its configuration anymore`);
        return super.reset();
    }
    isLoaded(): boolean {
        return !!this._advices;
    }

    private _assertNotCompiled(msg: string) {
        if (this._advices) {
            throw new WeavingError(msg);
        }
    }

    getAdvices(pointCutName: keyof MethodPointCutHooks): Advice<any>[] {
        return [...this._advices[pointCutName]];
    }
}
