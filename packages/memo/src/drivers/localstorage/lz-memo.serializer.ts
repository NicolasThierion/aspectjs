import { parse, stringify } from 'flatted';
import * as LZString from 'lz-string';
import { LsMemoSerializer } from './localstorage.driver';

export class LzMemoSerializer implements LsMemoSerializer {
    deserialize(str: string): any {
        if (str === null) {
            return str;
        }
        return parse(LZString.decompressFromUTF16(str));
    }
    serialize(obj: any): string {
        if (obj === null) {
            return null;
        }
        return LZString.compressToUTF16(stringify(obj));
    }
}
