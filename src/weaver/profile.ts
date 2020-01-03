import { Aspect } from './types';

let profileId = 0;

export class WeaverProfile {
    public readonly name: string;
    protected _aspects: Aspect[] = [];
    protected _aspectsRegistry: { [aspectName: string]: Aspect } = {};

    constructor(name?: string) {
        this.name = name ?? `default#${profileId++}`;
    }
    enable(...aspects: Aspect[]): this {
        aspects.forEach(p => this.setEnabled(p, true));
        return this;
    }
    disable(...aspects: Aspect[]): this {
        aspects.forEach(p => this.setEnabled(p, false));
        return this;
    }
    merge(...profiles: WeaverProfile[]): this {
        profiles.forEach(p => p._aspects.forEach(p => this.enable(p)));
        return this;
    }
    reset(): this {
        this._aspects = [];
        this._aspectsRegistry = {};
        return this;
    }
    setEnabled(aspect: Aspect, enabled: boolean): this {
        _assertIsAspect(aspect);
        if (enabled) {
            const oldAspect = this._aspectsRegistry[aspect.name];
            if (oldAspect) {
                console.warn(
                    `Aspect ${aspect.constructor.name} overrides aspect "${oldAspect?.constructor.name ??
                        'unknown'}" already registered for name ${aspect.name}`,
                );
            }

            this._aspectsRegistry[aspect.name] = aspect;
            this._aspects.push(aspect);
        } else {
            delete this._aspectsRegistry[aspect.name];
        }

        return this;
    }
}

function _assertIsAspect(obj: Aspect) {
    if (!(obj instanceof Aspect)) {
        throw new TypeError('given object is not an Aspect');
    }

    if (!obj.name) {
        throw new TypeError(`Aspect "${obj.constructor.name}" can not have null "name" attribute`);
    }
}
