import * as LZString from 'lz-string';
import { MemoEntry } from '../../memo.types';
import { SimpleLsSerializer } from './serializers/ls-serializer';

/**
 * Uses lz-string to compress serialized values in order to save-up some LocalStorage space.
 * @public
 */
export class LzMemoSerializer<T = unknown> extends SimpleLsSerializer {
    deserialize(str: string): Omit<MemoEntry, 'key'> {
        if (!str) {
            return null;
        }
        return super.deserialize(LZString.decompressFromUTF16(str));
    }
    serialize(obj: MemoEntry): string {
        if (!obj) {
            return null;
        }
        return LZString.compressToUTF16(super.serialize(obj));
    }
}
