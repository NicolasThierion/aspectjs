import { MemoEntry, MemoKey } from '../memo.types';
import { MemoFrame } from './memo-frame';
import { MarshallingContext } from '../marshalling/marshalling-context';

export abstract class MemoDriver {
    abstract getKeys(namespace?: string): Promise<MemoKey[]>;

    /**
     * Get the name of the driver this aspect uses.
     */
    abstract get NAME(): string;

    /**
     * Get the priority this driver should be picked up to handle the given type.
     */
    getPriority(context: MarshallingContext): number {
        return 0;
    }

    accepts(context: MarshallingContext): boolean {
        return true;
    }

    /**
     * Returns the cached value.
     * @param key
     */
    protected abstract read<T>(key: MemoKey): MemoFrame<T>;

    protected abstract write(key: MemoKey, value: MemoFrame): PromiseLike<void>;

    protected abstract doRemove(key: MemoKey): PromiseLike<void>;

    getValue(key: MemoKey): MemoEntry {
        const frame = this.read(key);
        return frame
            ? {
                  key,
                  frame,
              }
            : undefined;
    }

    setValue<T>(entry: MemoEntry<T>): PromiseLike<void> {
        const key = entry.key;
        // const context = this.marshallersRegistry.createMarshallingContext(key);

        // const frame = context.marshal(entry.value);
        // frame.expiration = entry.expiration;
        return this.write(key, entry.frame);
    }

    remove(key: MemoKey): PromiseLike<void> {
        return this.doRemove(key);
    }
}
