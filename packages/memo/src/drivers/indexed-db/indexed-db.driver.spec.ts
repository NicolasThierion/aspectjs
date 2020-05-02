import { Memo } from '../../memo.annotation';
import { LoadTimeWeaver, setWeaver } from '@aspectjs/core';
import { DefaultCacheableAspect } from '../../cacheable/cacheable.aspect';
import { Cacheable } from '../../cacheable/cacheable.annotation';
import { IndexedDbDriver } from './indexed-db.driver';
import { MemoAspect } from '../../memo.aspect';
import { createLocalStorage } from 'localstorage-ponyfill';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const idb = require('fake-indexeddb') as typeof indexedDB;

interface Runner {
    process(...args: any[]): any;
}

let CacheableA: any;
let CacheableB: any;
function _setupIdbMemoAspect(indexedDB: IDBFactory): void {
    const ls = createLocalStorage();
    ls.clear();

    setWeaver(
        new LoadTimeWeaver().enable(
            new MemoAspect().drivers(
                new IndexedDbDriver({
                    indexedDB,
                    localStorage: ls,
                }),
            ),
            new DefaultCacheableAspect(),
        ),
    );
}

xdescribe('IndexedDbMemoDriver', () => {
    describe(`when calling a method annotated with @Memo({type = 'indexeddb'})`, () => {
        let r: Runner;
        let process: Runner['process'];
        let ns: string;
        let expiration: Date | number;

        const defaultArgs = ['a', 'b', 'c', 'd'];

        beforeEach(() => {
            ns = undefined;
            _setupIdbMemoAspect(idb);

            @Cacheable()
            // eslint-disable-next-line @typescript-eslint/class-name-casing
            class _CacheableA {}
            CacheableA = _CacheableA;
            @Cacheable()
            // eslint-disable-next-line @typescript-eslint/class-name-casing
            class _CacheableB {}
            CacheableB = _CacheableB;

            class RunnerImpl implements Runner {
                @Memo({
                    driver: IndexedDbDriver,
                    namespace: () => ns,
                    expiration: () => expiration,
                })
                process(...args: any[]): any {
                    return process(...args);
                }
            }

            r = new RunnerImpl();
            process = jasmine
                .createSpy('process', function _process(...args: any[]) {
                    return Promise.resolve(args.reverse());
                })
                .and.callThrough();
        });

        describe('once', () => {
            it('should call the method once', () => {
                const res = r.process(...defaultArgs);
                expect(process).toHaveBeenCalled();
                expect(res).toEqual(defaultArgs.reverse());
                expect(process).toHaveBeenCalledTimes(1);
            });
        });
    });
});
