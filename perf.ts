import { AnnotationFactory } from './src/annotation/factory/factory';
import 'reflect-metadata';
import { on } from './src/weaver/advices/pointcut';
import { Before } from './src/weaver/advices/before/before.decorator';
import { JoinPoint, setWeaver } from './src';
import { After } from './src/weaver/advices/after/after.decorator';
import { AfterContext, AroundContext, BeforeContext } from './src/weaver/advices/advice-context';
import { Around } from './src/weaver/advices/around/around.decorator';
import { LoadTimeWeaver } from './src/weaver/load-time/load-time-weaver';
import { Aspect } from './src/weaver/advices/aspect';

const iterations = 1000000;

let noAopTime = 0;
let aopTime = 0;

noAopTime += withoutAop(iterations);
aopTime += withAop(iterations);

console.log(`elapsed time without AOP : ${noAopTime} ms`);
console.log(`elapsed time with AOP : ${aopTime} ms`);
console.log(`ratio: ${aopTime / noAopTime} times slower`);

function fn(i: number) {
    return [...new Array(10).join(i + '')].length > 10 ? i : null;
}
function withoutAop(iterations = 10000) {
    const t = new Date().getTime();
    class A {
        private i: any;
        constructor(i: number) {
            this.i = fn(i);
        }
    }

    for (let i = 0; i < iterations; ++i) {
        new A(i);
    }
    const tt = new Date().getTime();
    return tt - t;
}

function withAop(iterations = 10000) {
    const af = new AnnotationFactory('test');

    const ClassHooks = af.create(function ClassHooks(): ClassDecorator {
        return;
    });
    @Aspect('ClassAspect')
    class ClassAspect {
        @Before(on.class.annotations(ClassHooks))
        before(ctxt: BeforeContext<any, any>) {}

        @After(on.class.annotations(ClassHooks))
        after(ctxt: AfterContext<any, any>) {}

        @Around(on.class.annotations(ClassHooks))
        around(ctxt: AroundContext<any, any>, jp: JoinPoint) {
            return jp();
        }
    }
    setWeaver(new LoadTimeWeaver().enable(new ClassAspect()));

    const t = new Date().getTime();
    @ClassHooks()
    class A {
        private i: any;
        constructor(i: number) {
            this.i = fn(i);
        }
    }

    for (let i = 0; i < iterations; ++i) {
        new A(i);
    }
    const tt = new Date().getTime();

    return tt - t;
}
