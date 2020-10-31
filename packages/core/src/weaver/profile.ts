import { getAspectOptions } from '../utils/utils';
import { AspectType } from './types';
import { assert, isObject, isString } from '@aspectjs/core/utils';

let profileId = 0;

export class WeaverProfile {
    public readonly name: string;
    protected _aspectsRegistry: {
        [aspectId: string]: AspectType;
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
    disable(...aspects: (object | string)[]): this {
        aspects.forEach((p) => {
            if (p instanceof WeaverProfile) {
                // disable profile
                Object.values(p._aspectsRegistry).forEach((p) => this.disable(p));
            } else if (isObject(p)) {
                // disable aspect
                this.setEnabled(p, false);
            } else {
                assert(isString(p));
                // delete aspect by id
                delete this._aspectsRegistry[p];
            }
        });
        return this;
    }
    reset(): this {
        this._aspectsRegistry = {};
        return this;
    }
    setEnabled(aspect: AspectType, enabled: boolean): this {
        const id = getAspectOptions(aspect).id;
        if (enabled) {
            // avoid enabling an aspect twice
            const oldAspect = this._aspectsRegistry[id];
            if (oldAspect && oldAspect !== aspect) {
                console.warn(
                    `Aspect ${aspect.constructor.name} overrides aspect "${
                        oldAspect?.constructor.name ?? 'unknown'
                    }" already registered for name ${id}`,
                );
            }

            this._aspectsRegistry[id] = aspect;
        } else {
            delete this._aspectsRegistry[id];
        }

        return this;
    }
    getAspect<T extends AspectType>(aspect: string | (new () => T)): T | undefined {
        if (isString(aspect)) {
            return this._aspectsRegistry[aspect] as T;
        } else {
            return this._aspectsRegistry[getAspectOptions(aspect).id] as T;
        }
    }
}
