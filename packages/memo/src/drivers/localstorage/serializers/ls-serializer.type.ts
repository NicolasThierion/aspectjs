import { MemoEntry } from '../../../memo.types';

/**
 * Serialize & deserialize an object to/from a string so it can be stored into LocalStorage.
 * @public
 */
export interface LsMemoSerializer {
    deserialize(obj: string): Omit<MemoEntry, 'key'>;

    serialize(obj: Omit<MemoEntry, 'key'>): string;
}
