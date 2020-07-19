import { MemoDriver, MemoDriverOptions } from '../memo.driver';
import { MemoKey } from '../../memo.types';
import { parse, stringify } from 'flatted';
import { MemoFrame } from '../memo-frame';
import { isUndefined } from '../../utils/utils';
import { InstantPromise } from '../../utils/instant-promise';

export interface LsMemoSerializer<T = unknown, U = unknown> {
    deserialize(obj: string): MemoFrame<T>;
    serialize(obj: MemoFrame<T>): string;
}

export interface LsMemoDriverOptions extends MemoDriverOptions {
    localStorage?: typeof localStorage;
    serializer?: LsMemoSerializer;
}

enum RawMemoField {
    VALUE,
    TYPE,
    INSTANCE_TYPE,
    EXPIRY,
    VERSION,
}
const F = RawMemoField;

export const DEFAULT_LS_DRIVER_OPTIONS = {
    serializer: {
        deserialize(serialized: string): MemoFrame {
            if (!serialized) {
                return null;
            }
            const raw = parse(serialized);
            return new MemoFrame({
                value: raw[F.VALUE],
                type: raw[F.TYPE],
                instanceType: raw[F.INSTANCE_TYPE],
                expiry: raw[F.EXPIRY] ? new Date(raw[F.EXPIRY]) : undefined,
                version: raw[F.VERSION],
            });
        },
        serialize(obj: MemoFrame): string {
            const raw = {} as any;

            if (!isUndefined(obj.value)) {
                raw[F.VALUE] = obj.value;
            }
            if (!isUndefined(obj.type)) {
                raw[F.TYPE] = obj.type;
            }
            if (!isUndefined(obj.instanceType)) {
                raw[F.INSTANCE_TYPE] = obj.instanceType;
            }
            if (!isUndefined(obj.expiry)) {
                raw[F.EXPIRY] = obj.expiry;
            }
            if (!isUndefined(obj.version)) {
                raw[F.VERSION] = obj.version;
            }
            return stringify(raw);
        },
    } as LsMemoSerializer,
};

export class LsMemoDriver extends MemoDriver {
    protected readonly _options: LsMemoDriverOptions;
    readonly NAME = 'localStorage';

    constructor(options?: LsMemoDriverOptions) {
        super({ ...DEFAULT_LS_DRIVER_OPTIONS, ...options });

        if (!this._ls) {
            throw new Error('localStorage not available on this platform, and no implementation was provided');
        }
    }

    private get _ls(): typeof localStorage {
        return this._options.localStorage ?? localStorage;
    }

    getKeys(namespace: string): Promise<MemoKey[]> {
        const res: string[] = [];
        for (let i = 0; i < this._ls.length; ++i) {
            const k = this._ls.key(i);
            if (k.startsWith(namespace)) {
                res.push();
            }
        }

        return Promise.resolve(res.map(MemoKey.parse));
    }

    /**
     * Accepts all kind of results
     * @param type
     */
    getPriority(type: any): number {
        return 10;
    }

    read<T>(key: MemoKey): MemoFrame<T> {
        const serializer = this._options?.serializer ?? DEFAULT_LS_DRIVER_OPTIONS.serializer;
        return serializer.deserialize(this._ls.getItem(key.toString())) as MemoFrame<T>;
    }

    write(key: MemoKey, value: MemoFrame): PromiseLike<void> {
        const serializer = this._options?.serializer ?? DEFAULT_LS_DRIVER_OPTIONS.serializer;
        this._ls.setItem(key.toString(), serializer.serialize(value));
        return InstantPromise.resolve();
    }

    doRemove(key: MemoKey): PromiseLike<void> {
        this._ls.removeItem(key.toString());
        return InstantPromise.resolve();
    }
}
