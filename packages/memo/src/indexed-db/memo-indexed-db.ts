import { Aspect } from '@aspectjs/core/src/weaver/advices/aspect';
import { on } from '@aspectjs/core/src/weaver/advices/pointcut';
import { Memo } from './lib';
import { Around } from '@aspectjs/core/src/weaver/advices/around/around.decorator';

@Aspect('aspectjs/memo')
export class MemoAspect {
    @Around(on.method.withAnnotations(Memo))
    memoize() {}
}
