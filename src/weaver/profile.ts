import { AnnotationLocation } from '../annotation/location/location';
import { isString } from '../utils';
import { WeavingError } from './weaving-error';
import { AnnotationFactory } from '../annotation/factory/factory';

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
        aspects.forEach(p => this.setEnabled(p, true));
        return this;
    }
    disable(...aspects: object[]): this {
        aspects.forEach(p => this.setEnabled(p, false));
        return this;
    }
    merge(...profiles: WeaverProfile[]): this {
        profiles.forEach(p => Object.values(p._aspectsRegistry).forEach(p => this.enable(p)));
        return this;
    }
    reset(): this {
        this._aspectsRegistry = {};
        return this;
    }
    setEnabled(aspect: object, enabled: boolean): this {
        const id = _getAspectId(aspect);
        if (enabled) {
            const oldAspect = this._aspectsRegistry[id];
            if (oldAspect) {
                console.warn(
                    `Aspect ${aspect.constructor.name} overrides aspect "${oldAspect?.constructor.name ??
                        'unknown'}" already registered for name ${id}`,
                );
            }

            this._aspectsRegistry[id] = aspect;
        } else {
            delete this._aspectsRegistry[id];
        }

        return this;
    }
}

let _globalAspectId = 0;

function _getAspectId(obj: object): string {
    const options = Reflect.getOwnMetadata('aspectjs.aspect.options', obj.constructor);
    if (!options) {
        throw new TypeError(`${obj.constructor.name} is not an Aspect`);
    }
    if (!options.id) {
        return `AnonymousAspect#${_globalAspectId++}`;
    } else {
        if (!isString(options.id)) {
            throw new WeavingError(`Aspect ${obj.constructor.name} should have a string id. Got: ${options.id}`);
        }
    }
    return options.id;
}
