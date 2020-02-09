import { Aspect } from '../../src/weaver/advices/aspect';
import { WeaverProfile } from '../../src/weaver/profile';
import { AnnotationFactory } from '../../src/annotation/factory/factory';
import { Around } from '../../src/weaver/advices/around/around.decorator';
import { on } from '../../src/weaver/advices/pointcut';
import { Memo } from './memo';
import { AroundContext } from '../../src/weaver/advices/advice-context';
import 'typescript/lib/lib.dom';

const af = new AnnotationFactory('aspectjs');

export const LsMemo = af.create(function LsMemo(): MethodDecorator {
    return;
});

@Aspect('Memo.Sync')
export class LocalStorageMemo {
    private ls: typeof localStorage;
    constructor(localStorageImpl?: typeof localStorage) {
        this.ls = localStorageImpl ?? localStorage;
        if (!this.ls) {
            throw new Error('localStorage not available on this platform, and no implementation was provided');
        }
    }

    @Around(on.method.withAnnotations(Memo))
    @Around(on.method.withAnnotations(LsMemo))
    applyMemo<T>(ctxt: AroundContext<any, any>): T | Promise<T> {
        throw new Error('not implemented');
        const key = `lscache_${ctxt.target}`;
        let cache = this.ls.getItem(key);
        if (cache) {
            // todo handle expiration
        } else {
        }
        return new Promise(() => {});
    }
}

export const localStorageMemoProfile = new WeaverProfile().enable(new LocalStorageMemo());
