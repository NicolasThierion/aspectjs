import { AnnotationType, Aspect, Compile, CompileContext, on } from '@aspectjs/core';
import { Cacheable, CacheableOptions } from './cacheable.annotation';
import { assert, getMetaOrDefault, isObject } from '../utils/utils';

type Prototype = {
    constructor: Function;
};

export interface CacheableAspect {
    readonly cacheTypeStore: CacheTypeStore;
}

export interface CacheTypeStore {
    getPrototype(key: string): Prototype;
    getVersion(key: string): any;
    getTypeKey<T extends Prototype>(proto: T): string;

    addPrototype<T extends Prototype>(proto: T, key: string, version?: any): void;
}

/**
 * Assign a key to the prototype of a class into a CacheTypeStore,
 * so that Memo drivers can inflate memoized objects with proper types.
 */
@Aspect('@aspectjs/cacheable')
export class DefaultCacheableAspect implements CacheableAspect {
    constructor(public readonly cacheTypeStore: CacheTypeStore = new CacheTypeStoreImpl()) {}
    @Compile(on.class.withAnnotations(Cacheable))
    registerCacheKey(ctxt: CompileContext<any, AnnotationType.CLASS>) {
        let options = ctxt.annotation.args[0] as CacheableOptions;
        if (!isObject(options)) {
            options = {
                typeId: options,
            };
        }
        const typeId = options.typeId ?? _generateTypeId(ctxt.target.proto);

        this.cacheTypeStore.addPrototype(ctxt.target.proto, typeId, options.version);
    }
}

/**
 * Store class prototypes along with a defined key.
 */
export class CacheTypeStoreImpl implements CacheTypeStore {
    private readonly _prototypes: Record<string, Prototype> = {};
    private readonly _versions: Record<string, string> = {};

    getPrototype(key: string): Prototype {
        assert(!!key, 'key must be defined');
        const proto = this._prototypes[key];
        if (!proto) {
            throw new Error(`no prototype found for key ${key}`);
        }
        return proto;
    }

    getTypeKey<T extends Prototype>(prototype: T): string {
        const key = _generateTypeId(prototype);
        if (!this._prototypes[key]) {
            throw new TypeError(
                `Cannot find cache key for object ${prototype.constructor.name}. Are you sure you are caching a class annotated with "@Cacheable()"?`,
            );
        }
        return key;
    }

    addPrototype<T extends Prototype>(proto: Prototype, key: string, version?: string): void {
        if (this._prototypes[key] && this._prototypes[key] !== proto) {
            throw new Error(
                `Cannot add key for ${proto?.constructor?.name}: key already exists for ${this._prototypes[key]?.constructor?.name}`,
            );
        }

        this._versions[key] = version;
        this._prototypes[key] = proto;
    }

    getVersion<T extends Prototype>(key: string): string {
        return this._versions[key];
    }
}

let globalId = 0;
function _generateTypeId(proto: any): string {
    return getMetaOrDefault('@aspectjs/cacheable:typekey', proto, () => {
        return `${proto.constructor.name}#${globalId++}`;
    });
}
