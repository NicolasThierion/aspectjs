import { LsMemoAspect } from './memo-localstorage';
import { LzMemoHandler } from './lz-memo-handler';
import { Memo, MemoHandler } from '../memo.annotation';
import { createLocalStorage } from 'localstorage-ponyfill';
import { LoadTimeWeaver, setWeaver } from '@aspectjs/core';
import { DefaultCacheableAspect } from '../cacheable-aspect';

const DEFAULT_ARGS = ['a', 'b', 'c', 'd'];

describe('LocalMemoAspect', () => {
    describe('configured with LsCacheHandler', () => {
        let handler: MemoHandler;

        interface Cached {
            method(...args: any[]): any;
        }

        let cached: Cached;
        beforeEach(() => {
            handler = new LzMemoHandler();
            spyOn(handler, 'onRead').and.callThrough();
            spyOn(handler, 'onWrite').and.callThrough();
            const localStorage = createLocalStorage();
            localStorage.clear();
            setWeaver(
                new LoadTimeWeaver()
                    .enable(
                        new LsMemoAspect({
                            localStorage,
                            handler,
                        }),
                    )
                    .enable(new DefaultCacheableAspect()),
            );

            class CachedImpl implements Cached {
                @Memo()
                method(...args: any[]): any {
                    return args.reverse();
                }
            }

            cached = new CachedImpl();
        });

        describe('calling a cache-enabled method once', () => {
            it('should call handler.onWrite once', () => {
                expect(handler.onWrite).not.toHaveBeenCalled();
                cached.method(...DEFAULT_ARGS);
                expect(handler.onWrite).toHaveBeenCalled();
                expect(handler.onWrite).toHaveBeenCalledTimes(1);
            });
        });

        describe('calling a cache-enabled method twice', () => {
            it('should call handler.onRead once', () => {
                expect(handler.onRead).not.toHaveBeenCalled();

                const res1 = cached.method(...DEFAULT_ARGS);
                const res2 = cached.method(...DEFAULT_ARGS);

                expect(res1).toEqual(res2);

                expect(handler.onRead).toHaveBeenCalled();
                expect(handler.onRead).toHaveBeenCalledTimes(1);
            });
        });
    });
});
