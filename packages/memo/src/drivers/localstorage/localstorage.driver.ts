import { MarshallingContext } from '../../marshalling/marshalling-context';
import { MemoEntry, MemoKey } from '../../memo.types';
import { InstantPromise } from '../../utils';
import { MemoDriver } from '../memo.driver';
import { SimpleLsSerializer } from './serializers/ls-serializer';
import { LsMemoSerializer } from './serializers/ls-serializer.type';

/**
 * Options supported by the LsMemoDriver
 * @public
 */
export interface LsMemoDriverOptions {
    localStorage?: typeof localStorage;
    serializer?: LsMemoSerializer;
}

/**
 * @public
 */
export const DEFAULT_LS_DRIVER_OPTIONS = {
    serializer: new SimpleLsSerializer(),
};

/**
 * Memo driver to store async @Memo result into the Indexed Database.
 * @public
 */
export class LsMemoDriver extends MemoDriver {
    static readonly NAME = 'localStorage';
    readonly NAME = LsMemoDriver.NAME;

    constructor(public options?: LsMemoDriverOptions) {
        super();
        this.options = { ...DEFAULT_LS_DRIVER_OPTIONS, ...options };
        if (!this._ls) {
            throw new Error('localStorage not available on this platform, and no implementation was provided');
        }
    }

    private get _ls(): typeof localStorage {
        return this.options.localStorage ?? localStorage;
    }

    getKeys(namespace: string): Promise<MemoKey[]> {
        const res: MemoKey[] = [];
        for (let i = 0; i < this._ls.length; ++i) {
            const kStr = this._ls.key(i);
            const key = MemoKey.parse(kStr, false);
            if (key?.namespace === namespace) {
                res.push(key);
            }
        }

        return Promise.resolve(res);
    }

    /**
     * Accepts all kind of results
     * @param context - the marshalling context for the current 'to-be-stored' value
     */
    getPriority(context: MarshallingContext): number {
        return 10;
    }

    read<T>(key: MemoKey): MemoEntry<T> {
        const serializer = this.options?.serializer ?? DEFAULT_LS_DRIVER_OPTIONS.serializer;
        const frame = serializer.deserialize(this._ls.getItem(key.toString())) as MemoEntry<T>;
        return frame
            ? {
                  key,
                  ...frame,
              }
            : undefined;
    }

    write(entry: MemoEntry): PromiseLike<void> {
        const serializer = this.options?.serializer ?? DEFAULT_LS_DRIVER_OPTIONS.serializer;
        this._ls.setItem(entry.key.toString(), serializer.serialize(entry));
        return InstantPromise.resolve();
    }

    remove(key: MemoKey): PromiseLike<void> {
        this._ls.removeItem(key.toString());
        return InstantPromise.resolve();
    }
}
