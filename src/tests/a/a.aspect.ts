// import { AClass } from './index';
// import { Aspect, AspectHooks } from '../../weaver/types';
// import { AnnotationContext } from '../../annotation/context/context';
//
// export class AAspect extends Aspect {
//     name = 'AClassLabel';
//
//     addLabels(ctxt: AnnotationContext<any, ClassDecorator>) {
//         ctxt.instance._labels = ctxt.instance._labels ?? [];
//         ctxt.instance._labels.push('AClass');
//     }
//
//     apply(hooks: AspectHooks): void {
//         // hooks.compile.handlers.enable(...)
//         // hooks.compile.handlers.disable(...)
//         // // hooks.load.withAnnotations(...).config()
//         // // hooks.load.withAnnotations().beforeAdd()
//         // // hooks.load.withAnnotations(...).beforeAdd()
//         // hooks.compile.withAnnotations(AClass).onAdd(this.addLabels);
//         // // hooks.load.withAnnotations().afterAdd()
//         // // hooks.load.withAnnotations(...).afterAdd()
//         //
//         // // hooks.exec.withAnnotations().around()
//         // // hooks.exec.withAnnotations(...).around()
//         // // hooks.exec.withAnnotations(AClass).before(this.addLabels);
//         // // hooks.exec.withAnnotations(...).before()
//         // // hooks.exec.withAnnotations().afterReturn()
//         // // hooks.exec.withAnnotations(...).afterReturn()
//         // // hooks.exec.withAnnotations().after()
//         // // hooks.exec.withAnnotations(...).after()
//         // // hooks.exec.withAnnotations().afterThrow()
//         // // hooks.exec.withAnnotations(...).afterThrow()
//         //
//         // // // hooks.withAnnotations(...).config({});
//         // // // hooks.config.provide(...);
//         // // hooks.withAnnotations().load.beforeAdd();
//         // // hooks.withAnnotations(...).load.afterAdd();
//         // // hooks.withAnnotations().exec.around(() => {});
//         // // hooks.withAnnotations(...).exec.around(() => {});
//         // // hooks.withAnnotations().exec.before(() => {});
//         // // hooks.withAnnotations(...).exec.before(() => {});
//         // // hooks.withAnnotations().exec.after(() => {});
//         // // hooks.withAnnotations(...).exec.after(() => {});
//         // // hooks.withAnnotations().exec.afterReturn(() => {});
//         // // hooks.withAnnotations(...).exec.afterReturn(() => {});
//         // // hooks.withAnnotations().exec.afterThrow(() => {});
//         // // hooks.withAnnotations(...).exec.afterThrow(() => {});
//
//         hooks.withAnnotations(AClass).before(this.addLabels);
//         // throw new Error('not implemented');
//     }
//
//     //
//     // load(hooks: AnnotationCompilationHooks) {
//     //     hooks.handlers.errors.wrongPriority()
//     // }
//     //
//     // execute(hooks: MethodPointCutHooks) {
//     //
//     // }
// }
