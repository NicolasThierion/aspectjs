import { isString } from '../utils';
import { ASPECT_OPTIONS_REFLECT_KEY } from '../advice/aspect';

let profileId = 0;

export class WeaverProfile {
    public readonly name: string;
    protected _aspectsRegistry: {
        [aspectId: string]: any;
    } = {};

    constructor(name?: string) {
        this.name = name ?? `default#${profileId++}`;
    }
    enable(...aspects: object[]): this {
        aspects.forEach((p) => {
            if (p instanceof WeaverProfile) {
                Object.values(p._aspectsRegistry).forEach((p) => this.enable(p));
            } else {
                this.setEnabled(p, true);
            }
        });
        return this;
    }
    disable(...aspects: object[]): this {
        aspects.forEach((p) => {
            if (p instanceof WeaverProfile) {
                Object.values(p._aspectsRegistry).forEach((p) => this.disable(p));
            } else {
                this.setEnabled(p, false);
            }
            Reflect.defineMetadata('@aspectjs/aspect:enabled', false, p);
        });
        return this;
    }
    reset(): this {
        this._aspectsRegistry = {};
        return this;
    }
    setEnabled(aspect: object, enabled: boolean): this {
        const id = _getAspectId(aspect);
        if (enabled) {
            // avoid enabling an aspect twice
            if (!Reflect.getOwnMetadata('@aspectjs/aspect:enabled', aspect)) {
                const oldAspect = this._aspectsRegistry[id];
                if (oldAspect) {
                    console.warn(
                        `Aspect ${aspect.constructor.name} overrides aspect "${
                            oldAspect?.constructor.name ?? 'unknown'
                        }" already registered for name ${id}`,
                    );
                }
                Reflect.defineMetadata('@aspectjs/aspect:enabled', false, aspect);

                this._aspectsRegistry[id] = aspect;
            }
        } else {
            delete this._aspectsRegistry[id];
        }

        return this;
    }
    getAspect(aspectId: string) {
        return this._aspectsRegistry[aspectId];
    }
}

let _globalAspectId = 0;

function _getAspectId(obj: object): string {
    const options = Reflect.getOwnMetadata(ASPECT_OPTIONS_REFLECT_KEY, obj.constructor);
    if (!options) {
        throw new TypeError(`${obj.constructor.name} is not an Aspect`);
    }
    if (!options.id) {
        return `AnonymousAspect#${_globalAspectId++}`;
    } else {
        if (!isString(options.id)) {
            throw new TypeError(`Aspect ${obj.constructor.name} should have a string id. Got: ${options.id}`);
        }
    }
    return options.id;
}
