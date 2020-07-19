---
home: true
heroText: '@AspectJS'
tagline: The AOP framework for javascript
actionText: Get Started →
actionLink: docs/01.guide/
features:
- title: Modern
  details: Leverages <a href="https://github.com/tc39/proposal-decorators"><b>ES8 decorators stage 1</b></a> to bring aspect-oriented programming to your Javascript and Typescript code.
- title: Easy to use
  details: Creating and invoking aspects just requires a few decorators 
- title: Based on standards
  details: AspectJS offers an API that mimics <a href="https://www.eclipse.org/aspectj/">AspectJ</a>, the king of java-based AOP frameworks.
footer: MIT Licensed
---

 
![ci-status]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

### Installation:
:::: tabs
::: tab with npm
```
npm install @aspectjs/core
```
:::
::: tab with yarn
```
yarn add @aspectjs/core
```
:::
::::

### Custom aspect example

:::: tabs
::: tab javascript
```js
import { 
    on,
    AnnotationFactory, 
    getWeaver,
    Aspect 
} from '@aspectjs/core';

// Define the annotation
const Monitored = new AnnotationFactory('myNamespace')
    .create(function Monitored(maxTime) { });

// Define the aspect to trigger with this annotation
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

// Enable the @Monitored aspect
getWeaver().enable(new MonitoredAspect());

// Use the aspect
class Processor {
    @Monitored(10)
    process() {
        console.log('processing...');
        for (let i = 0; i < 10000000; ++i) {}
    }
}

new Processor().process();
```
:::
::: tab typescript
```typescript
import { 
    on,
    AnnotationFactory, 
    getWeaver,
    JoinPoint,
    Aspect 
} from '@aspectjs/core';

// Define the annotation
const Monitored = new AnnotationFactory('test')
    .create(function Monitored(maxTime: number): MethodDecorator { return; });

// Define the aspect to trigger with this annotation
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

// Enable the @Monitored aspect
getWeaver().enable(new MonitoredAspect());

// Use the aspect
class Processor {
    @Monitored(10)
    process() {
        console.log('processing...');
        for (let i = 0; i < 10000000; ++i) {}
    }
}

new Processor().process();
```
::::
