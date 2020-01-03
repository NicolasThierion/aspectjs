import { Aspect, AspectHooks } from '../../../weaver/types';

export class AnnotationPriorityAspect implements Aspect {
    name: string;

    apply(hooks: AspectHooks): void {
        hooks.annotations().class.setup(target => {
            console.log(target);
        });
    }
}
