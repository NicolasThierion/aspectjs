import { resetWeaverContext } from '@aspectjs/core/testing';

import { LsMemoDriver, LsMemoSerializer } from './localstorage.driver';
import { LzMemoSerializer } from './lz-memo.serializer';
import { Memo } from '../../memo.annotation';
import { DefaultCacheableAspect } from '../../cacheable/cacheable.aspect';
import { MemoAspect } from '../../memo.aspect';

const DEFAULT_ARGS = ['a', 'b', 'c', 'd'];

describe('LocalStorageMemoDriver configured with LzMemoHandler', () => {
    let cached: Cached;
    let methodSpy: jasmine.Spy;
    let serializer: LsMemoSerializer;

    interface Cached {
        method(...args: any[]): any;
    }

    beforeEach(() => {
        serializer = new LzMemoSerializer();

        resetWeaverContext()
            .getWeaver()
            .enable(
                new MemoAspect().addDriver(
                    new LsMemoDriver({
                        serializer,
                    }),
                ),
            )
            .enable(new DefaultCacheableAspect());
    });

    describe(`when calling a method annotated with @Memo({type = 'localstorage'})`, () => {
        beforeEach(() => {
            methodSpy = jasmine.createSpy('methodSpy').and.callFake((...args: any[]) => args.reverse());
            spyOn(serializer, 'deserialize').and.callThrough();
            spyOn(serializer, 'serialize').and.callThrough();
            localStorage.clear();

            class CachedImpl implements Cached {
                @Memo()
                method(...args: any[]): any {
                    return methodSpy(...args);
                }
            }

            cached = new CachedImpl();
        });

        describe('once', () => {
            it('should call serializer.serialize once', () => {
                expect(serializer.serialize).not.toHaveBeenCalled();
                cached.method(...DEFAULT_ARGS);
                expect(serializer.serialize).toHaveBeenCalled();
                expect(serializer.serialize).toHaveBeenCalledTimes(1);
            });
        });

        describe('calling a cache-enabled method twice', () => {
            it('should call serializer.deserialize twice', () => {
                expect(serializer.deserialize).not.toHaveBeenCalled();

                cached.method(...DEFAULT_ARGS);
                cached.method(...DEFAULT_ARGS);

                expect(serializer.deserialize).toHaveBeenCalled();
                expect(serializer.deserialize).toHaveBeenCalledTimes(2);
            });

            it('should return the same result', () => {
                const res1 = cached.method(...DEFAULT_ARGS);
                const res2 = cached.method(...DEFAULT_ARGS);

                expect(res1).toEqual(res2);
            });

            it('should call serializer.serialize once', () => {
                expect(serializer.serialize).not.toHaveBeenCalled();

                cached.method(...DEFAULT_ARGS);
                cached.method(...DEFAULT_ARGS);

                expect(serializer.serialize).toHaveBeenCalled();
                expect(serializer.serialize).toHaveBeenCalledTimes(1);
            });
        });

        describe('with null arguments', function () {
            beforeEach(() => {
                methodSpy = jasmine.createSpy('methodSpy').and.callFake((...args: any[]) => {});
            });
            it('should not produce errors', () => {
                expect(() => cached.method(null)).not.toThrow();
            });
        });

        describe('with null return value', function () {
            beforeEach(() => {
                methodSpy = jasmine.createSpy('methodSpy').and.callFake((...args: any[]) => null);
            });

            it('should return null', () => {
                expect(cached.method(...DEFAULT_ARGS)).toEqual(null);
            });
        });
    });
});
