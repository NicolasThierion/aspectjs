import { AnnotationFactory, Around, AroundContext, Aspect, Before, BeforeContext, JoinPoint, on } from '@aspectjs/core';
import { MemoOptions, WrappedMemoValue } from '../memo.annotation';
import { parse, stringify } from 'flatted';
import { DEFAULT_MEMO_OPTIONS, MemoAspect } from '../memo.aspect';

const af = new AnnotationFactory('aspectjs');
export const LsMemo = af.create(function LsMemo(options: MemoOptions): MethodDecorator {
    return;
});

export interface LsMemoOptions extends MemoOptions {
    localStorage?: typeof localStorage;
}

export const DEFAULT_LS_MEMO_OPTIONS: Required<LsMemoOptions> = {
    localStorage: undefined,
    ...DEFAULT_MEMO_OPTIONS,
    handler: {
        onRead(str: string): WrappedMemoValue<any> {
            if (str === null || str === undefined) {
                return null;
            }
            return parse(str);
        },
        onWrite(obj: WrappedMemoValue<any>): string {
            return stringify(obj);
        },
    },
};

@Aspect('Memo.Sync')
export class LsMemoAspect extends MemoAspect {
    protected readonly _params: LsMemoOptions;

    constructor(options: LsMemoOptions = DEFAULT_LS_MEMO_OPTIONS) {
        super({ ...DEFAULT_LS_MEMO_OPTIONS, ...options });

        if (!this._ls) {
            throw new Error('localStorage not available on this platform, and no implementation was provided');
        }
    }

    private get _ls(): typeof localStorage {
        return this._params.localStorage ?? localStorage;
    }
    @Around(on.method.withAnnotations(LsMemo), {
        priority: 50,
    })
    applyMemo<T>(ctxt: AroundContext<any, any>, jp: JoinPoint): T {
        return super.applyMemo(ctxt, jp);
    }

    @Before(on.method.withAnnotations(LsMemo))
    generateKey(ctxt: BeforeContext<any, any>) {
        return super.generateKey(ctxt);
    }

    getKeys(): string[] {
        const res: string[] = [];
        for (let i = 0; i < this._ls.length; ++i) {
            res.push(this._ls.key(i));
        }
        return res;
    }

    doRemove(key: string): void {
        this._ls.removeItem(key);
    }

    doWrite(key: string, value: any): void {
        this._ls.setItem(key, value);
    }

    doRead(key: string): any {
        return this._ls.getItem(key);
    }
}
