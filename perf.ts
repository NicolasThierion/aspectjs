import 'reflect-metadata';

import { AnnotationFactory } from './packages/core/src/annotation/factory/factory';
import { on } from './packages/core/src/weaver/advices/pointcut';
import { Before } from './packages/core/src/weaver/advices/before/before.decorator';
import { After } from './packages/core/src/weaver/advices/after/after.decorator';
import { AfterContext, AroundContext, BeforeContext } from './packages/core/src/weaver/advices/advice-context';
import { Around } from './packages/core/src/weaver/advices/around/around.decorator';
import { LoadTimeWeaver } from './packages/core/src/weaver/load-time/load-time-weaver';
import { Aspect } from './packages/core/src/weaver/advices/aspect';
import { MethodAnnotation } from './packages/core/src/annotation/annotation.types';
import { JoinPoint } from './packages/core/src/weaver/types';
// import { JoinPoint, setWeaver } from './src/lib';
//
// const iterations = 1000000;
//
// let noAopTime = 0;
// let aopTime = 0;
//
// noAopTime += withoutAop(iterations);
// aopTime += withAop(iterations);
//
// console.log(`elapsed time without AOP : ${noAopTime} ms`);
// console.log(`elapsed time with AOP : ${aopTime} ms`);
// console.log(`ratio: ${aopTime / noAopTime} times slower`);
//
// function fn(i: number) {
//     return [...new Array(10).join(i + '')].length > 10 ? i : null;
// }
// function withoutAop(iterations = 10000) {
//     const t = new Date().getTime();
//     class A {
//         private i: any;
//         constructor(i: number) {
//             this.i = fn(i);
//         }
//     }
//
//     for (let i = 0; i < iterations; ++i) {
//         new A(i);
//     }
//     const tt = new Date().getTime();
//     return tt - t;
// }
//
// function withAop(iterations = 10000) {
//     const af = new AnnotationFactory('test');
//
//     const ClassHooks = af.create(function ClassHooks(): ClassDecorator {
//         return;
//     });
//     @Aspect('ClassAspect')
//     class ClassAspect {
//         @Before(on.class.withAnnotations(ClassHooks))
//         before(ctxt: BeforeContext<any, any>) {}
//
//         @After(on.class.withAnnotations(ClassHooks))
//         after(ctxt: AfterContext<any, any>) {}
//
//         @Around(on.class.withAnnotations(ClassHooks))
//         around(ctxt: AroundContext<any, any>, jp: JoinPoint) {
//             return jp();
//         }
//     }
//     setWeaver(new LoadTimeWeaver().enable(new ClassAspect()));
//
//     const t = new Date().getTime();
//     @ClassHooks()
//     class A {
//         private i: any;
//         constructor(i: number) {
//             this.i = fn(i);
//         }
//     }
//
//     for (let i = 0; i < iterations; ++i) {
//         new A(i);
//     }
//     const tt = new Date().getTime();
//
//     return tt - t;
// }
//
//
//
//
//

@Aspect('memo')
class VarMemoAspect {
    registry: Record<string, any> = {};

    @Around(on.method.withAnnotations(Memo))
    memo(ctxt: AroundContext<any, any>, joinpoint: JoinPoint) {
        if (typeof this.registry[ctxt.target.toString()] !== 'undefined') {
            const res = joinpoint();

            this.registry[ctxt.target.toString()] = res;
        } else {
            return this.registry[ctxt.target.toString()];
        }
    }
}

const af = new AnnotationFactory('aspect.js');

const Memo: MethodAnnotation = af.create(function Memo(ttl: number): MethodDecorator {
    return;
});

class Processor {
    @Memo(3000)
    process(iterations = 100000) {
        const arr = [];

        for (let i = 0; i < iterations; ++i) {
            arr.push(i);
        }

        return arr;
    }
}

const p = new Processor();

console.log(p.process());
