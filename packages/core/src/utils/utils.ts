import { getProto } from '@aspectjs/core/utils';
import { AspectType } from '../weaver/types';
import { ASPECT_OPTIONS_REFLECT_KEY, AspectOptions } from '../advice/aspect';

class Locator<U> {
    constructor(private _obj: U, private _parent?: Locator<any>, private _parentKey?: string | number | symbol) {}

    at<K extends keyof U>(k: K): Locator<U[K]> {
        return new Locator(this._obj ? this._obj[k] : undefined, this, k);
    }

    get(): U {
        return this._obj;
    }

    orElse(valueProvider: () => U, save = true): U {
        const value = this._obj ?? valueProvider();
        if (save) {
            this._obj = value;
            this._parent._patch(value, this._parentKey);
        }
        return value;
    }

    private _patch<K extends keyof U>(value: U[K], key: K) {
        if (!this._obj) {
            this._obj = {} as U;
            if (this._parent) {
                this._parent._patch(this._obj, this._parentKey);
            }
        }
        this._obj[key] = value;
    }
}
export function locator<U = unknown>(obj: U) {
    return new Locator(obj);
}

export function isAspect(aspect: AspectType | Function) {
    if (!aspect) {
        return false;
    }
    const proto = getProto(aspect);
    if (proto.constructor) {
        if (!!Reflect.getOwnMetadata(ASPECT_OPTIONS_REFLECT_KEY, proto.constructor)) {
            return true;
        }
    }

    return false;
}

export function assertIsAspect(aspect: AspectType | Function) {
    const proto = getProto(aspect);
    if (!isAspect(aspect)) {
        throw new TypeError(`${proto.constructor.name} is not an Aspect`);
    }
}

export function getAspectOptions(aspect: AspectType | Function): AspectOptions {
    assertIsAspect(aspect);
    return Reflect.getOwnMetadata(ASPECT_OPTIONS_REFLECT_KEY, getProto(aspect).constructor);
}
