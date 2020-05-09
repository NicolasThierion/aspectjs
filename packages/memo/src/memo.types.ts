import { MemoWrap, MemoWrapper } from './drivers/memo-wrap';
import { CacheTypeStore } from './cacheable/cacheable.aspect';

const KEY_IDENTIFIER = '@aspectjs:Memo';

export class MemoKey {
    public readonly namespace: string;
    public readonly targetKey: string;
    public readonly instanceId: string;
    public readonly argsKey: string;
    private readonly _strValue: string;

    constructor(key: Omit<MemoKey, '_strValue'>) {
        this.namespace = key.namespace;
        this.targetKey = key.targetKey;
        this.instanceId = key.instanceId;
        this.argsKey = key.argsKey;
        this._strValue = `${KEY_IDENTIFIER}:${this.namespace}/{${this.targetKey}#${this.instanceId}}(${this.argsKey})`;
    }

    static parse(str: string): MemoKey {
        if (!str.startsWith(KEY_IDENTIFIER)) {
            throw new TypeError(`Key ${str} is not a memo key`);
        }
        const rx = new RegExp('.*?:(namespace)/\\{(targetKey)\\#(instanceId)}\\((argsKey)\\)');
        const r = rx.exec(str);
        return new MemoKey(r.groups as any);
    }

    toString(): string {
        return this._strValue;
    }
}

export interface MemoValue<T = any> {
    readonly value: T;
    readonly expiry?: Date;
}

export interface MemoSerializer<T = any, U = any> {
    deserialize(obj: U, context: DeserializationContext): MemoWrap<T>;
    serialize(obj: MemoWrap<T>, context: SerializationContext): U;
}

export interface SerializationContext {
    key: MemoKey;
    defaultWrap<T>(value: T): MemoWrap<T> | Promise<MemoWrap<T>>;
    blacklist?: Map<any, MemoWrap>;
    typeStore: CacheTypeStore;
    readonly async: Promise<any>[]; // serialization will wait until this promise is resolved
}

export interface DeserializationContext {
    key: MemoKey;
    blacklist?: Map<MemoWrap, any>;
    typeStore: CacheTypeStore;
    defaultUnwrap<T>(wrap: MemoWrap<T>): T;
}
