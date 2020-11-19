import { MemoEntry } from '../../../memo.types';
import { compressToUTF16, decompressFromUTF16 } from '../../../utils/lz-string';
import { SimpleLsSerializer } from './ls-serializer';

/**
 * Uses lz-string to compress serialized values in order to save-up some LocalStorage space.
 * @public
 */
export class LzMemoSerializer<T = unknown> extends SimpleLsSerializer {
    deserialize(str: string): Omit<MemoEntry, 'key'> {
        if (!str) {
            return null;
        }
        return super.deserialize(decompressFromUTF16(str));
    }
    serialize(obj: MemoEntry): string {
        if (!obj) {
            return null;
        }
        return compressToUTF16(super.serialize(obj));
    }
}
