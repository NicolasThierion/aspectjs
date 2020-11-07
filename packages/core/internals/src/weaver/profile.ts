import { AspectType } from './types';
import { _getAspectOptions, assert, isObject, isString } from '../utils/utils';

/**
 * A WeaverProfile is a set of Aspects that can be enabled or disabled.
 * The profile itself is meant to be enabled on a Weaver, making it easy to enable multiples aspects at once.
 * @public
 */
export class WeaverProfile {
    protected _aspectsRegistry: {
        [aspectId: string]: AspectType;
    } = {};

    constructor() {}
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
        const id = _getAspectOptions(aspect).id;
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
            return this._aspectsRegistry[_getAspectOptions(aspect).id] as T;
        }
    }
}
