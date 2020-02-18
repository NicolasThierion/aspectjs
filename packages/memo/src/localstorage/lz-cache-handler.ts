import { CacheHandler } from './memo-localstorage';
import { parse, stringify } from 'flatted';
import * as LZString from 'lz-string';

export class LzCacheHandler implements CacheHandler {
    onRead(str: string): any {
        return parse(LZString.decompressFromUTF16(str));
    }
    onWrite(obj: any): string {
        return LZString.compressToUTF16(stringify(obj));
    }
}
