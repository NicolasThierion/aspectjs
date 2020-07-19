import { MemoFrame } from './drivers/memo-frame';

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

export interface MemoEntry<T = any> {
    readonly key: MemoKey;
    readonly value: T;
    readonly expiry?: Date;
}

export interface MarshallingContext<T = unknown> {
    key: MemoKey;
    blacklist?: Map<any, MemoFrame<T>>;
    defaultMarshal(value: T): MemoFrame<T>;
    readonly async: Promise<any>[]; // marshalling will wait until these promises are resolved
}

export interface UnmarshallingContext {
    key: MemoKey;
    blacklist?: Map<MemoFrame, any>;
    defaultUnmarshal<T>(frame: MemoFrame<T>): T;
    readonly async: Promise<any>[]; // unmarshalling will wait until these promises are resolved
}
