import { Aspect, AspectHooks } from '../../../weaver/types';

export class AAspect implements Aspect {
    name: string;

    apply(h: AspectHooks): void {
        throw new Error('not implemented');
    }
}
