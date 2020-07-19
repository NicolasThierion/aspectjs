import { WeaverProfile } from '@aspectjs/core';
import { IdbMemoDriver, LsMemoDriver, LzMemoSerializer } from '../drivers';
import { DefaultCacheableAspect } from '../cacheable/cacheable.aspect';
import { MemoAspect } from '../memo.aspect';
import {
    AnyMarshaller,
    ArrayMarshaller,
    BasicMarshaller,
    DateMarshaller,
    MemoMarshaller,
    ObjectMarshaller,
    PromiseMarshaller,
} from '../marshallers';

/** Default marshallers used bu the default profile */
export const DEFAULT_MARSHALLERS: MemoMarshaller[] = [
    new ObjectMarshaller(),
    new ArrayMarshaller(),
    new DateMarshaller(),
    new PromiseMarshaller(),
    new AnyMarshaller(),
    new BasicMarshaller(),
];

/**
 * Weaver profile configured with
 * - LsMemoAspect (for synchronous @Memo methods)
 *     - LzMemoHandler to compress data stored in LocalStorage
 * - IndexedDbMemoAspect (for asynchronous @Memo methods)
 */
export const defaultMemoProfile = new WeaverProfile().enable(
    new MemoAspect().drivers(
        new LsMemoDriver({
            marshallers: DEFAULT_MARSHALLERS,
            serializer: new LzMemoSerializer(),
        }),
        new IdbMemoDriver({
            marshallers: DEFAULT_MARSHALLERS,
        }),
    ),
    new DefaultCacheableAspect(),
);
