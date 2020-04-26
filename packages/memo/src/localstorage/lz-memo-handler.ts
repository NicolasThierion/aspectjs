import { parse, stringify } from 'flatted';
import * as LZString from 'lz-string';
import { MemoHandler } from '../memo.annotation';

export class LzMemoHandler implements MemoHandler {
    onRead(str: string): any {
        return parse(LZString.decompressFromUTF16(str));
    }
    onWrite(obj: any): string {
        return LZString.compressToUTF16(stringify(obj));
    }
}
