import { AnnotationLocation, AnnotationLocationFactory } from '../annotation/location/location';
import { AnnotationBundleRegistry } from '../annotation/bundle/bundle-factory';
import { isString, isUndefined } from '../utils';
import { WeavingError } from './weaving-error';

let profileId = 0;

export class WeaverProfile {
    public readonly name: string;
    protected _aspectsRegistry: {
        [aspectId: string]: {
            order: number;
            aspect: any;
        };
    } = {};
    private _globalOrder: number;

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
        profiles.forEach(p => Object.values(p._aspectsRegistry).forEach(p => this.enable(p.aspect)));
        return this;
    }
    reset(): this {
        this._aspectsRegistry = {};
        this._globalOrder = 0;
        return this;
    }
    setEnabled(aspect: object, enabled: boolean): this {
        const id = _getAspectId(aspect);
        if (enabled) {
            const oldAspect = this._aspectsRegistry[id];
            if (oldAspect) {
                console.warn(
                    `Aspect ${aspect.constructor.name} overrides aspect "${oldAspect.aspect?.constructor.name ??
                        'unknown'}" already registered for name ${id}`,
                );
            }

            this._aspectsRegistry[id] = {
                aspect,
                order: this._globalOrder++,
            };
        } else {
            delete this._aspectsRegistry[id];
        }

        return this;
    }
}

let _globalAspectId = 0;

function _getAspectId(obj: object): string {
    const location = AnnotationLocation.of(Reflect.getPrototypeOf(obj).constructor);
    const dtarget = AnnotationLocationFactory.getTarget(location);
    const bundle = AnnotationBundleRegistry.of(dtarget);

    const ctxt = bundle.at(location).all('@aspectjs:Aspect')[0];
    if (!ctxt) {
        throw new TypeError(`${obj.constructor.name} is not an Aspect`);
    }

    const args = ctxt.args;
    if (!args.length || isUndefined(args[0])) {
        args.push(`AnonymousAspect#${_globalAspectId++}`);
    } else {
        const id = args[0];
        if (!isString(id)) {
            throw new WeavingError(`Aspect ${obj.constructor.name} should have a string id. Got: ${id}`);
        }
        return id;
    }
}
