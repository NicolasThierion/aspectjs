# Abstract

@AspectJS brings aspect-oriented programming to your Javascript and Typescript code.

With ease-of-use in mind, it leverages [ES8 decorators stage 1](https://github.com/tc39/proposal-decorators)
to offer an API that mimics the popular the popular [AspectJ](https://www.eclipse.org/aspectj/) java library,
so it is easy to both use or create aspects.      

### Why ?

Aspect Oriented programming is a clean way to address cross-cutting concerns, while keeping **strong cohesion*  and **loose coupling**.
AspectJ changed the way java developers design software, and permitted the emergence quality frameworks that inter-operate with each other.

@AspectJS make it is easy to define standard annotations, that can be reused and re-purposed with various dynamic aspects. 

### Example

<!-- tabs:start -->
#### **javascript**
```js
import { 
    on,
    AnnotationFactory, 
    getWeaver,
    Aspect 
} from '@aspectjs/core';

const Monitored = new AnnotationFactory('test')
    .create(function Monitored(maxTime) { });

@Aspect()
class MonitoredAspect {
    @Around(on.method.withAnnotations(Monitored))
    aroundMonitoredAdvice(ctxt, jp) {
        const t = new Date().getTime();

        const result = jp();
        const elapsed = new Date().getTime() - t;

        const timeout = ctxt.annotation.args[0];
        if (timeout && timeout < elapsed) {
            throw new Error(`${ctxt.target.label} exceeded ${timeout} ms`);
        }
        console.log(`${ctxt.target} executed in ${elapsed} ms`);
        return result;
    }
}

getWeaver().enable(new MonitoredAspect());

class Processor {
    @Monitored(10)
    process() {
        console.log('processing...');
        for (let i = 0; i < 10000000; ++i) {}
    }
}

new Processor().process();
```
#### **typescript**
```typescript
import { 
    on,
    AnnotationFactory, 
    AnnotationType, 
    getWeaver,
    JoinPoint,
    Aspect 
} from '@aspectjs/core';

const Monitored = new AnnotationFactory('test')
    .create(function Monitored(maxTime: number): MethodDecorator { 
        return;
    });

@Aspect()
class MonitoredAspect {
    @Around(on.method.withAnnotations(Monitored))
    aroundMonitoredAdvice(
                    ctxt: AroundContext,
                    jp: JoinPoint) {
        const t = new Date().getTime();

        const result = jp();
        const elapsed = new Date().getTime() - t;

        const timeout = ctxt.annotation.args[0];
        if (timeout && timeout < elapsed) {
            throw new Error(`${ctxt.target.label} exceeded ${timeout} ms`);
        }
        console.log(`${ctxt.target} executed in ${elapsed} ms`);
        return result;
    }
}

getWeaver().enable(new MonitoredAspect());

class Processor {
    @Monitored(10)
    process() {
        console.log('processing...');
        for (let i = 0; i < 10000000; ++i) {}
    }
}

new Processor().process();
```
<!-- tabs:end -->

### AspectJS vs Other libraries
 - [aspectjs](https://www.npmjs.com/package/aspectjs):  
    - Do not use ES decorators.
    - Weaving aspects is based on class names.
 - [aspect.js](https://www.npmjs.com/package/aspect-js) by mgechev:  
    - Weaving aspects is based on class names.
    - No plug & play aspects. No reusable annotations.
 - [AspectJS](https://www.aspectjs.com/index) by Dodeca Technologies Ltd:  
    - Commercial product, not publicly available.

### AspectJS vs ES decorators

Decorators are great, and already allows adding cross-cutting behavior into our code.
However, unlike java annotation that are just empty interfaces, an ES decorator comes with its behavior built-in,
and there is no possibility to make the decorator do something else.

Let's consider a `@Sealed()` decorator:
```js
function Sealed(ctor) {
    Object.seal(ctor);

    return function(...args) {
        const obj = new ctor(args)
        Object.seal(obj);
        return obj;
    }
}

@Sealed()
class People {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
}
```

This decorator calls `Object.seal()` upon an object's construction, that prevents adding non-supported fields to it.
While this is useful to prevent developers mistakes, it may not worth the extra overhead once going in production, 
but in no way we can dynamically swap `@Sealed` behaviour with an empty implementation.

@AspectJS introduces "**Annotations**" to javascript, that are basically empty ES decorators.
Any library/framework may define standard annotations, 
and it is up to you to choose the aspects you want to dynamically bind to these annotations.
