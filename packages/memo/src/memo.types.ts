import { MemoFrame } from './drivers';

const KEY_IDENTIFIER = '@aspectjs:Memo';

/**
 * @public
 */
export class MemoKey {
    public readonly namespace: string;
    public readonly targetKey: string;
    public readonly instanceId: string;
    public readonly argsKey: string;
    private readonly _strValue: string;

    constructor(key: Omit<MemoKey, '_strValue'>, namespace?: string) {
        this.namespace = namespace ?? key.namespace;
        this.targetKey = key.targetKey;
        this.instanceId = key.instanceId;
        this.argsKey = key.argsKey;
        // TODO murmurhash this key after namespace
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

/**
 * @public
 */
export interface MemoEntry<T = any> {
    readonly key: MemoKey;
    readonly frame: MemoFrame<T>;
    readonly expiration?: Date;
}
