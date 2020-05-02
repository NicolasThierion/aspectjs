import { parse, stringify } from 'flatted';
import * as LZString from 'lz-string';
import { MemoSerializer } from '../../memo.types';

export class LzMemoSerializer implements MemoSerializer {
    deserialize(str: string): any {
        if (str === null) {
            return str;
        }
        return parse(LZString.decompress(str));
    }
    serialize(obj: any): string {
        if (obj === null) {
            return null;
        }
        return LZString.compress(stringify(obj));
    }
}
