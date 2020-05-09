import { MemoDriver, MemoDriverOptions } from '../memo.driver';
import { parse, stringify } from 'flatted';
import { Mutable } from '@aspectjs/core/src/utils';
import { MemoKey, MemoValue } from '../../memo.types';
import { isPromise } from '../../utils';

export interface IndexedDbDriverOptions extends MemoDriverOptions {
    indexedDB?: typeof indexedDB;
    localStorage?: typeof localStorage;
}

export class IdbMemoDriver extends MemoDriver {
    static readonly DATABASE_NAME = 'IndexedDbMemoAspect_db';
    static readonly STORE_NAME = 'results';
    static readonly DATABASE_VERSION = 1; // change this value whenever a backward-incompatible change is made to the store
    private _init$: Promise<IDBDatabase>;
    constructor(protected _params: IndexedDbDriverOptions = {}) {
        super(_params);
        this._init$ = this._openDb();
    }

    private get _idb(): IDBFactory {
        return this._params.indexedDB ?? indexedDB;
    }

    private get _ls(): typeof localStorage {
        return this._params.localStorage ?? localStorage;
    }

    get NAME(): 'indexeddb' {
        return 'indexeddb';
    }

    getKeys(namespace: string): Promise<MemoKey[]> {
        return this._init$.then(
            database =>
                new Promise<MemoKey[]>((resolve, reject) => {
                    const tx = database
                        .transaction(IdbMemoDriver.STORE_NAME)
                        .objectStore(IdbMemoDriver.STORE_NAME)
                        .getAllKeys();
                    tx.addEventListener('success', () =>
                        resolve(
                            tx.result
                                .map(id => id.toString())
                                .filter(id => id.startsWith(namespace))
                                .map(MemoKey.parse),
                        ),
                    );
                    tx.addEventListener('error', reject);
                }),
        );
    }

    private _openDb() {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const dbRequest = this._idb.open(IdbMemoDriver.DATABASE_NAME, IdbMemoDriver.DATABASE_VERSION);
            dbRequest.addEventListener('upgradeneeded', () => {
                const db = dbRequest.result;
                const store = db.createObjectStore(IdbMemoDriver.STORE_NAME, {
                    keyPath: 'ref',
                    autoIncrement: false,
                });
                store.createIndex('by_title', 'title', { unique: true });
            });
            dbRequest.addEventListener('success', () => resolve(dbRequest.result));
            dbRequest.addEventListener('error', err => reject(err));
        });
    }

    getPriority(type: any): number {
        return isPromise(type) ? 100 : 0;
    }

    doGetValue(key: MemoKey): MemoValue | undefined {
        const raw = this._ls.getItem(key.toString());
        if (!raw) {
            return;
        }
        const memo = parse(raw) as Mutable<MemoValue>;
        debugger;
        // TODO set memo.value =
        return memo;
    }

    doRemove(key: MemoKey): void {
        debugger;
    }

    doSetValue(key: MemoKey, memo: MemoValue): void {
        const { value, ...other } = { ...memo };
        // TODO store value;
        this._ls.setItem(key.toString(), stringify(other));
    }
}
