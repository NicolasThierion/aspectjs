import { MemoFrame } from './drivers';
import { MemoAspectError } from './errors';

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
        this._strValue = `${KEY_IDENTIFIER}:ns=${this.namespace}&tk=${this.targetKey}&id=${this.instanceId}&ak=${this.argsKey}`;
    }

    static parse(str: string, throwIfInvalid = true): MemoKey {
        if (!str.startsWith(KEY_IDENTIFIER)) {
            throw new TypeError(`Key ${str} is not a memo key`);
        }
        const rx = new RegExp(
            `${KEY_IDENTIFIER}:ns=(?<namespace>.*?)&tk=(?<targetKey>.*?)&id=(?<instanceId>.*?)&ak=(?<argsKey>.*)`,
        );
        const r = rx.exec(str);
        if (!r && throwIfInvalid) {
            throw new MemoAspectError(`given expression is not a MemoKey: ${str}`);
        }
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
    readonly signature?: string;
    readonly expiration?: Date;
}
