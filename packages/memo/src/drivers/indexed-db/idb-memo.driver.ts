import { WEAVER_CONTEXT } from '@aspectjs/core';
import { MemoDriver } from '../memo.driver';
import { MemoEntry, MemoKey } from '../../memo.types';
import { assert } from '@aspectjs/core/utils';
import { MemoFrame, MemoTypeInfoFrame } from '../memo-frame';
import { LsMemoDriver } from '..';
import { MemoAspect } from '../../memo.aspect';
import { MemoAspectError } from '../../errors';
import { Scheduler } from '../scheduler';
import { MarshallingContext } from '../../marshalling/marshalling-context';

enum TransactionMode {
    READONLY = 'readonly',
    READ_WRITE = 'readwrite',
}

/**
 * Options supported by the IdbMemoDriver
 * @public
 */
export interface IndexedDbDriverOptions {
    indexedDB: typeof indexedDB;
    localStorageDriver: LsMemoDriver;
}

/**
 * Memo driver to store async @Memo result into the Indexed Database.
 * @public
 */
export class IdbMemoDriver extends MemoDriver {
    static readonly NAME = 'indexedDb';
    readonly NAME = IdbMemoDriver.NAME;

    static readonly DATABASE_NAME = 'IndexedDbMemoAspect_db';
    static readonly STORE_NAME = 'results';
    static readonly DATABASE_VERSION = 1; // change this value whenever a backward-incompatible change is made to the store
    private readonly _scheduler = new Scheduler();
    private _init$: Promise<IDBDatabase>;
    private _localStorageDriver: MemoDriver;

    constructor(protected _params: Partial<IndexedDbDriverOptions> = {}) {
        super();
        this._init$ = this._openDb();
    }

    private get _idb(): IDBFactory {
        return this._params.indexedDB ?? indexedDB;
    }

    private get _ls(): MemoDriver {
        this._localStorageDriver = this._findLsDriver();
        return this._localStorageDriver;
    }

    getKeys(namespace: string): Promise<MemoKey[]> {
        return this._runTransactional((store) => store.getAllKeys(), TransactionMode.READONLY).then((result) => {
            return result
                .map((id) => id.toString())
                .map((str) => MemoKey.parse(str, false))
                .filter((k) => !!k);
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

    getPriority(context: MarshallingContext): number {
        return 100;
    }

    accepts(context: MarshallingContext): boolean {
        return context.frame.isAsync();
    }

    read<T>(key: MemoKey): MemoEntry<T> {
        const metaKey = createMetaKey(key);
        const metaEntry = this._ls.read(metaKey);

        if (!metaEntry) {
            return null;
        }

        assert(!!metaEntry.frame?.type);
        assert(!!metaEntry.key);

        const asyncValue = this._runTransactional((tx) => tx.get(key.toString())).then((frame) => {
            if (!frame) {
                this._ls.remove(metaKey);
                throw new MemoAspectError(`No data found for key ${key}`);
            }
            return frame.value;
        });

        const frame = new MemoFrame<T>({
            ...metaEntry,
            ...metaEntry.frame,
        }).setAsyncValue(asyncValue);

        this._scheduler.add(key.toString(), () => frame.async);

        return frame
            ? {
                  ...metaEntry,
                  key,
                  frame,
              }
            : undefined;
    }

    remove(key: MemoKey): PromiseLike<void> {
        return this._scheduler
            .add(key.toString(), () => this._deleteIdbEntry(key).then(() => this._deleteLsEntry(key)))
            .then(() => {});
    }

    write(entry: MemoEntry): PromiseLike<any> {
        return this._scheduler.add(entry.key.toString(), () => {
            const { value, ...metaFrame } = entry.frame;

            const metaEntry: MemoEntry<MemoTypeInfoFrame> = {
                ...entry,
                key: createMetaKey(entry.key),
                frame: metaFrame as MemoFrame,
            };
            // store only the Memo without its value
            this._ls.write(metaEntry);

            const valueFrame = { ref: entry.key.toString(), value };
            return this._runTransactional((s) => s.put(valueFrame));
        });
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

        const drivers = (WEAVER_CONTEXT.getWeaver().getAspect('@aspectjs/memo') as MemoAspect).getDrivers();
        if (!drivers['localStorage']) {
            throw new MemoAspectError(
                `${IdbMemoDriver.prototype.constructor.name} requires a "localStorage" driver, but option "localStorageDriver" is not set and no driver could be found with name "localStorage"`,
            );
        }
        return drivers['localStorage'];
    }
}

function createMetaKey(key: MemoKey) {
    return new MemoKey(key, `${key.namespace}[idb_meta]`);
}
