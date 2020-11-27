# AspectJS
 > The AOP framework for Javascript and Typescript

![logo]

[![ci-status]](https://gitlab.com/Pryum/aspectjs)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)


## Abstract 

Inspired by the [AspectJ](https://www.eclipse.org/aspectj/) java framework,
AspectJS Leverages [ES Decorators](https://github.com/tc39/proposal-decorators) to bring
aspect-oriented programming to Javascript and Typescript.

For more details & usage, please [read the documentation](https://nicolasthierion.github.io/aspectjs/)

### Installation:

```bash
yarn add @aspectjs/core
```

Or with npm:

```bash
npm install @aspectjs/core
```

### Example

```typescript
import { AnnotationFactory, BeforeContext, on, AnnotationType } from '@aspectjs/core/commons';
import { Aspect, Before, Order } from '@aspectjs/core/annotations';
import { WEAVER_CONTEXT } from '@aspectjs/core';

// Define the annotation
const Deprecated =  new AnnotationFactory('my-lib')
    .create(function Deprecated(message?: string): any { 
    // Annotation stub returns any, so typescript accepts the annotation
    // above both classes, properties, methods & parameters
    return;
 });

// Create an aspect to enhance the @Deprecated annotation
@Aspect()
class DeprecatedAspect {
    private tags: Record<string, boolean> = {};

    @Before(on.method.withAnnotations(Deprecated))     // before @Deprecated methods
    @Before(on.parameter.withAnnotations(Deprecated))  // before methods with @Deprecated parameters
    @Order(1)                                          // optional: give the execution order
    logWarning(context: BeforeContext) {         // context gets injected with some data relative to the current advice
        // get the unique target reference (ie: where the annotation is)
        const targetRef = context.target.ref;
        // if log warning not already raised for this target        
        if (!this.tags[targetRef]) {
            if (
                // log any deprecated method call
                context.target.type === AnnotationType.METHOD ||
                // log any method call with a non-undefined deprecated parameter.
                context.args[context.target.parameterIndex] !== undefined
            ) {
                // get the message provided to @Deprecated, if any                
                const message = context.annotations.onSelf(Deprecated)[0].args[0]; 
                // log a warning with either the provided message or a default one                
                console.warn(message ?? `${context.target.label} is deprecated`);
                // warning raised, don't produce further warnings for this target                
                this.tags[context.target.ref] = true;  
            }
        }
    }
}

// Enable DeprecatedAspect
WEAVER_CONTEXT.getWeaver().enable(new DeprecatedAspect());

// Use the aspect
(function main() {
    class Greetings {
        
        sayHello(@Deprecarted('parameter name is deprecated') name: string) {
                    console.log('Hello world')
        }
        @Deprecated()   
        sayGoodbye() {
            console.log('Goodbye world')
        }
    } 

    const g = new Greetings();
    g.sayHello('WORLD');    // will raise one warning
    g.sayGoodbye();         // will raise one warning
})();
```

## Projects of the AspectJS family: 
 - [`@aspectjs/memo`](https://www.npmjs.com/package/@aspectjs/memo)


MIT Licensed

[ci-status]: https://gitlab.com/Pryum/aspectjs/badges/master/pipeline.svg
[logo]: .README/aspectjs-256.png


