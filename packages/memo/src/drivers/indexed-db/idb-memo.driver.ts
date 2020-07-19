import { MemoDriver, MemoDriverOptions } from '../memo.driver';
import { MemoEntry, MemoKey } from '../../memo.types';
import { assert, isPromise } from '../../utils/utils';
import { MemoFrame, MemoMetaFrame } from '../memo-frame';
import { LsMemoDriver } from '../localstorage/localstorage.driver';
import { Partial } from 'rollup-plugin-typescript2/dist/partial';
import { getWeaver } from '@aspectjs/core';
import { MemoAspect } from '../../memo.aspect';
import { MemoAspectError } from '../../errors';
import { Scheduler } from '../scheduler';

enum TransactionMode {
    READONLY = 'readonly',
    READ_WRITE = 'readwrite',
}
export interface IndexedDbDriverOptions extends MemoDriverOptions {
    indexedDB: typeof indexedDB;
    localStorageDriver: LsMemoDriver;
}

export class IdbMemoDriver extends MemoDriver {
    static readonly DATABASE_NAME = 'IndexedDbMemoAspect_db';
    static readonly STORE_NAME = 'results';
    static readonly DATABASE_VERSION = 1; // change this value whenever a backward-incompatible change is made to the store
    private readonly _scheduler = new Scheduler();
    private _init$: Promise<IDBDatabase>;
    private _localStorageDriver: MemoDriver;

    constructor(protected _params: Partial<IndexedDbDriverOptions> = {}) {
        super(_params);
        this._init$ = this._openDb();
    }

    private get _idb(): IDBFactory {
        return this._params.indexedDB ?? indexedDB;
    }

    private get _ls(): MemoDriver {
        this._localStorageDriver = this._findLsDriver();
        return this._localStorageDriver;
    }

    get NAME(): 'indexedDb' {
        return 'indexedDb';
    }

    getKeys(namespace: string): Promise<MemoKey[]> {
        return this._runTransactional((store) => store.getAllKeys(), TransactionMode.READONLY).then((result) => {
            return result
                .map((id) => id.toString())
                .filter((id) => id.startsWith(namespace))
                .map(MemoKey.parse);
        });
    }

    private _openDb() {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const dbRequest = this._idb.open(IdbMemoDriver.DATABASE_NAME, IdbMemoDriver.DATABASE_VERSION);
            dbRequest.addEventListener('upgradeneeded', () => {
                const db = dbRequest.result;
                const store = db.createObjectStore(IdbMemoDriver.STORE_NAME, {
                    keyPath: 'ref', // TODO handle other MemoKey fields
                    autoIncrement: false,
                });
                store.createIndex('by_key', 'key', { unique: true });
            });
            dbRequest.addEventListener('success', () => resolve(dbRequest.result));
            dbRequest.addEventListener('error', (err) => reject(err));
        });
    }

    getPriority(type: any): number {
        return isPromise(type) ? 100 : 0;
    }

    read<T>(key: MemoKey): MemoFrame<T> {
        const meta = this._ls.getValue(key);

        if (!meta) {
            return null;
        }

        assert(!!meta.value.type);
        const frame = new MemoFrame<T>({
            ...meta,
            ...meta.value,
        }).setAsyncValue(this._runTransactional((tx) => tx.get(key.toString())).then((frame) => frame.value));

        this._scheduler.add(meta.key.toString(), () => frame.async);

        return frame;
    }

    setValue<T>(entry: MemoEntry<T>): PromiseLike<void> {
        return this._scheduler.add(entry.key.toString(), () => super.setValue(entry));
    }

    remove(key: MemoKey): PromiseLike<void> {
        return this._scheduler.add(key.toString(), () => super.remove(key)).then(() => {});
    }

    doRemove(key: MemoKey): Promise<void> {
        return this._deleteIdbEntry(key).then(() => this._deleteLsEntry(key));
    }

    write(key: MemoKey, frame: MemoFrame): Promise<any> {
        const { value, expiry, ...metaFrame } = frame;

        const metaEntry: MemoEntry<MemoMetaFrame> = {
            key,
            expiry,
            value: metaFrame,
        };
        // store only the Memo without its value
        this._ls.setValue(metaEntry);

        const valueFrame = { ref: key.toString(), value };
        return this._runTransactional((s) => s.put(valueFrame));
    }

    private _deleteIdbEntry(key: MemoKey) {
        return this._runTransactional((s) => s.delete(key.toString()));
    }

    private _deleteLsEntry(key: MemoKey) {
        this._ls.remove(key);
    }

    private _runTransactional<R>(
        transactionFn: (store: IDBObjectStore) => IDBRequest<R>,
        mode: TransactionMode = TransactionMode.READ_WRITE,
    ): Promise<R> {
        return this._init$.then(
            (database) =>
                new Promise<R>((resolve, reject) => {
                    const store = database
                        .transaction(IdbMemoDriver.STORE_NAME, mode)
                        .objectStore(IdbMemoDriver.STORE_NAME);

                    const request = transactionFn(store);

                    request.addEventListener('success', () => resolve(request.result));
                    request.addEventListener('error', (r) => {
                        const error = (r.target as any)?.error ?? r;
                        console.error(error);
                        return reject(error);
                    });
                }),
        );
    }

    private _findLsDriver() {
        if (this._localStorageDriver) {
            return this._localStorageDriver;
        }

        if (this._params.localStorageDriver) {
            return this._params.localStorageDriver;
        }

        const drivers = (getWeaver().getAspect('@aspectjs/memo') as MemoAspect).getDrivers();
        if (!drivers['localStorage']) {
            throw new MemoAspectError(
                `${IdbMemoDriver.prototype.constructor.name} requires a "localStorage" driver, but option "localStorageDriver" is not set and no driver could be found with name "localStorage"`,
            );
        }
        return drivers['localStorage'];
    }
}