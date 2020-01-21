export * from './src/lib';
//
// import { AnnotationFactory } from './src/annotation/factory/factory';
// import 'reflect-metadata';
//
// import { on } from './src/weaver/advices/pointcut';
// import { Before } from './src/weaver/advices/before/before.decorator';
// import { Aspect, getWeaver } from './src';
// import { After } from './src/weaver/advices/after/after.decorator';
// import { AfterContext, BeforeContext } from './src/weaver/advices/advice-context';
//
// const af = new AnnotationFactory('test');
//
// const TimeCheck = af.create(function TimeCheck(): ClassDecorator {
//     return;
// });
//
// class MonitoredAspect extends Aspect {
//     id = 'MonitoredAspect';
//
//     t: number;
//     tt: number;
//
//     constructor(private threshold: number) {
//         super();
//     }
//
//     @Before(on.class.annotations(TimeCheck))
//     before(ctxt: BeforeContext<any, any>) {
//         this.t = new Date().getTime();
//     }
//
//     @After(on.class.annotations(TimeCheck))
//     after(ctxt: AfterContext<any, any>) {
//         this.tt = new Date().getTime();
//         const elapsed = this.tt - this.t;
//         if (elapsed > this.threshold) {
//             throw new Error(`${ctxt.target.label} execution took ${elapsed} ms, but limit is ${this.threshold}`);
//         }
//     }
// }
// getWeaver().enable(new MonitoredAspect(1000));
//
// @TimeCheck()
// class A {
//     constructor(name: string) {
//         console.log(name);
//         for (let i = 0; i < 1000000000; ++i) {}
//     }
// }
//
// new A('a');
