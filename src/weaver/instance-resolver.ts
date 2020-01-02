import { WeavingError } from './weaving-error';

export class InstanceResolver<T> {
    private _instance: T;
    private _dirty = false;

    instance(): T {
        if (!this._instance) {
            throw new WeavingError('Cannot get "this" instance before constructor joinpoint has been called');
        }

        this._dirty = true;
        return this._instance;
    }

    resolve(instance: T) {
        this._dirty = false;

        this._instance = instance;
    }

    isResolved() {
        return !!this._instance;
    }

    isDirty() {
        return this._dirty;
    }
}
