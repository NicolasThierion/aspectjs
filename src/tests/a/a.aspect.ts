import { AClass } from './index';
import { Aspect, AspectHooks } from '../../weaver/types';
import { AnnotationContext } from '../../annotation/context/context';

export class AAspect extends Aspect {
    name = 'AClassLabel';

    addLabels(ctxt: AnnotationContext<any, ClassDecorator>) {
        ctxt.instance._labels = ctxt.instance._labels ?? [];
        ctxt.instance._labels.push('AClass');
    }

    apply(hooks: AspectHooks): void {
        // hooks.compile.handlers.enable(...)
        // hooks.compile.handlers.disable(...)
        // // hooks.load.annotations(...).config()
        // // hooks.load.annotations().beforeAdd()
        // // hooks.load.annotations(...).beforeAdd()
        // hooks.compile.annotations(AClass).onAdd(this.addLabels);
        // // hooks.load.annotations().afterAdd()
        // // hooks.load.annotations(...).afterAdd()
        //
        // // hooks.exec.annotations().around()
        // // hooks.exec.annotations(...).around()
        // // hooks.exec.annotations(AClass).before(this.addLabels);
        // // hooks.exec.annotations(...).before()
        // // hooks.exec.annotations().afterReturn()
        // // hooks.exec.annotations(...).afterReturn()
        // // hooks.exec.annotations().after()
        // // hooks.exec.annotations(...).after()
        // // hooks.exec.annotations().afterThrow()
        // // hooks.exec.annotations(...).afterThrow()
        //
        // // // hooks.annotations(...).config({});
        // // // hooks.config.provide(...);
        // // hooks.annotations().load.beforeAdd();
        // // hooks.annotations(...).load.afterAdd();
        // // hooks.annotations().exec.around(() => {});
        // // hooks.annotations(...).exec.around(() => {});
        // // hooks.annotations().exec.before(() => {});
        // // hooks.annotations(...).exec.before(() => {});
        // // hooks.annotations().exec.after(() => {});
        // // hooks.annotations(...).exec.after(() => {});
        // // hooks.annotations().exec.afterReturn(() => {});
        // // hooks.annotations(...).exec.afterReturn(() => {});
        // // hooks.annotations().exec.afterThrow(() => {});
        // // hooks.annotations(...).exec.afterThrow(() => {});

        hooks.annotations(AClass).before(this.addLabels);
        // throw new Error('not implemented');
    }

    //
    // load(hooks: AnnotationCompilationHooks) {
    //     hooks.handlers.errors.wrongPriority()
    // }
    //
    // execute(hooks: MethodPointCutHooks) {
    //
    // }
}
