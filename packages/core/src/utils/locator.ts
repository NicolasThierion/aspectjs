class Locator<U> {
    constructor(private _obj: U, private _parent?: Locator<any>, private _parentKey?: string | number | symbol) {}

    at<K extends keyof U>(k: K): Locator<U[K]> {
        return new Locator(this._obj ? this._obj[k] : undefined, this, k);
    }

    get(): U {
        return this._obj;
    }

    orElseCompute(valueProvider: () => U): U {
        return this.orElse(valueProvider, true);
    }

    orElseGet(valueProvider: () => U): U {
        return this.orElse(valueProvider, false);
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
