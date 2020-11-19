import { isUndefined } from '@aspectjs/core/utils';
import { parse, stringify } from 'flatted';
import { MemoEntry } from '../../../memo.types';
import { MemoFrame } from '../../memo-frame';
import { LsMemoSerializer } from './ls-serializer.type';

enum RawMemoField {
    VALUE,
    TYPE,
    INSTANCE_TYPE,
    EXPIRATION,
    VERSION,
    SIGNATURE,
    HASH,
}

const F = RawMemoField;

export class SimpleLsSerializer implements LsMemoSerializer {
    deserialize(serialized: string): Omit<MemoEntry, 'key'> {
        if (!serialized) {
            return null;
        }
        const raw = parse(serialized);
        return {
            expiration: raw[F.EXPIRATION] ? new Date(raw[F.EXPIRATION]) : undefined,
            frame: new MemoFrame({
                value: raw[F.VALUE],
                type: raw[F.TYPE],
                instanceType: raw[F.INSTANCE_TYPE],
                version: raw[F.VERSION],
                hash: raw[F.HASH],
            }),
            signature: raw[F.SIGNATURE],
        };
    }

    serialize(entry: Omit<MemoEntry, 'key'>): string {
        const raw = {} as any;

        if (!isUndefined(entry.frame.value)) {
            raw[F.VALUE] = entry.frame.value;
        }
        if (!isUndefined(entry.frame.type)) {
            raw[F.TYPE] = entry.frame.type;
        }
        if (!isUndefined(entry.frame.instanceType)) {
            raw[F.INSTANCE_TYPE] = entry.frame.instanceType;
        }
        if (!isUndefined(entry.frame.version)) {
            raw[F.VERSION] = entry.frame.version;
        }
        if (!isUndefined(entry.frame.hash)) {
            raw[F.HASH] = entry.frame.hash;
        }
        if (!isUndefined(entry.expiration)) {
            raw[F.EXPIRATION] = entry.expiration;
        }
        if (!isUndefined(entry.signature)) {
            raw[F.SIGNATURE] = entry.signature;
        }
        return stringify(raw);
    }
}
