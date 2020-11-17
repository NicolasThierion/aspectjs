import { WeaverProfile } from '@aspectjs/core/commons';
import { DefaultCacheableAspect } from '../cacheable/cacheable.aspect';
import { IdbMemoDriver, LsMemoDriver, LsMemoSerializer, LzMemoSerializer, MemoDriver } from '../drivers';
import { DEFAULT_MARSHALLERS, MemoAspect, MemoAspectOptions } from '../memo.aspect';
import { ObservableMarshaller, ObservableMemoSupportAspect } from '../observables';

/**
 * @public
 */
export interface MemoProfileFeatures {
    useLocalStorage?: boolean;
    useIndexedDb?: boolean;
    useLzString?: boolean;
    supportsObservables?: boolean;
    options?: MemoAspectOptions;
}

/**
 * Weaver profile configured with
 * - LsMemoAspect (for synchronous @Memo methods)
 *     - LzMemoHandler to compress data stored in LocalStorage
 * - IndexedDbMemoAspect (for asynchronous @Memo methods)
 * @public
 */
export class MemoProfile extends WeaverProfile {
    protected _features: MemoProfileFeatures = {
        useLocalStorage: true,
        useIndexedDb: true,
        useLzString: true,
        supportsObservables: false,
        options: {},
    };
    constructor(memoProfileFeatures?: MemoProfileFeatures) {
        super();

        this.enable(new DefaultCacheableAspect());
        this._features.options = memoProfileFeatures?.options ?? this._features.options;
        this._features.supportsObservables =
            memoProfileFeatures?.supportsObservables ?? this._features.supportsObservables;
        this._features.useIndexedDb = memoProfileFeatures?.useIndexedDb ?? this._features.useIndexedDb;
        this._features.useLzString = memoProfileFeatures?.useLzString ?? this._features.useLzString;
        this._features.useLocalStorage = memoProfileFeatures?.useLocalStorage ?? this._features.useLocalStorage;

        const marshallers = [...DEFAULT_MARSHALLERS];
        const drivers: MemoDriver[] = [];
        if (this._features.supportsObservables) {
            marshallers.push(new ObservableMarshaller());
            this.enable(new ObservableMemoSupportAspect());
        }

        if (this._features.useIndexedDb) {
            drivers.push(new IdbMemoDriver());
        }

        if (this._features.useLocalStorage) {
            let serializer: LsMemoSerializer;
            if (this._features.useLzString) {
                serializer = new LzMemoSerializer();
            }
            drivers.push(
                new LsMemoDriver({
                    serializer,
                }),
            );
        }

        const memoAspect = new MemoAspect({
            marshallers,
            drivers,
        });

        this.enable(memoAspect);
    }

    public configure(features: MemoProfileFeatures): MemoProfile {
        return new MemoProfile({ ...this._features, ...features });
    }
}
