# @Aspectjs/core

## Installation
```
npm install @aspectjs/core
```

**For typescript:** 
- Please enable decorators support in your `tsconfig.json`:
    ```json
    {
      "compilerOptions": {
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true
        }
    }
    ```
## Abstract
### What is it ?

@AspectJS leverages [ES8 decorators stage 1](https://github.com/tc39/proposal-decorators)
to superpower your Javascript and Typescript code with a bit of aspect-oriented programming. 

@AspectJS has been designed to share some similarities with the popular [AspectJ](https://www.eclipse.org/aspectj/) java library, 
so it has a smooth learning curve and it is easy to both use or create aspects.      

### Why ?

Aspect Oriented programming litteraly changed our way to design software.
It allows **strong cohesion* and clean **separation of concerns** for your code.

#### There are several of aspect libraries in javascript. Why another one?
 - [aspectjs](https://www.npmjs.com/package/aspectjs):  
   Do not use es decorators.
 - [aspect.js](https://www.npmjs.com/package/aspect-js) by mgechev:  
   Aspects are not plug & play. Pointcuts are based on namoing pattern rather than annotations
 - [AspectJS](https://www.aspectjs.com/index) by Dodeca Technologies Ltd:  
  It is a commercial product, and we don't have access to the sources.

#### What's wrong with standard ES decorators

Decorators are great; they already allow us to add cross-cutting behavior into our code.
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

This decorator calls `Object.seal()` on a people instance upon construction to prevent adding non-supported fields to it?
While this is useful to prevent developers mistakes, it may not worth the extra overhead once going in production, 
but in no way we can dynamically swap `@Sealed` behaviour with an empty implementation.

**@AspectJS** introduces "Annotations" to javascript, that are basically empty ES decorators.
Any library/framework may define standard annotations, 
and it is up to you to choose the aspects you want to dynamically bind to these annotations.

## Usage

### Create an annotation
- with ES6+
```js
import { AnnotationFactory } from '@aspectjs/core';
const factory = new AnnotationFactory('my-project-namespace');
const MyAnnotation = factory.create(function MyAnnotation(param1, param2) { /* empty body */});

@MyAnnotation('string', 0)
class Data {
}
```
- with Typescript
```typescript
import { AnnotationFactory } from '@aspectjs/core';

const factory = new AnnotationFactory('my-project-namespace');
const MyAnnotation = factory.create(function MyAnnotation(param1: string, param2: number): ClassDecorator { return; });

@MyAnnotation('string', 0)
class Data {
}
```
AnnotationFactory takes a mandatory `groupId` parameter, 
used to differentiate your `@MyAnnotation` with some `@MyAnnotation` from other libraries.

### Define an aspect

An @AspectJS aspect is an class with the `@Aspect()` annotation. 
```js
import { on } from '@aspectjs/core';

@Aspect('someUniqueId') // Optional id
class MyAspect {

    @Before(on.class.withAnnotations(MyAnnotation))
    beforeMyAnnotationClassAdvice(ctxt) {
    }
}
```
An Aspect that specifies an ID will replace any already configured aspect with the same ID.
This is useful if you want an annotation configured by default with an aspect, that is yet customizable.

The `@Before` decorator configures a pointcut on all classes annotated with `@MyAnnotation`. 
Here is a list of all the pointcut you can configure;  

- **Class advices**
  - Replace class constructor:
    ```typescript
    @Compile(on.class./*... */)
    advice(ctxt: CompileContext) { 
        /* ... */
    }
    ```
  - Before class constructor:
    ```typescript
    @Before(on.class./*... */)
    advice(ctxt: BeforeContext) { /* ... */}
    ```
  - Around class constructor:
    ```typescript
    @Around(on.class./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]) {
        // do something before constructor
        const instance = jp(); // invoke original constructor (eventually)
        // do domething after constructor
        return instance;
    }
    ```
  - After class constructor did return:
    ```typescript
    @AfterReturn(on.class./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any) {
        return returnValue++; // return a new value 
    }
    ```
  - after class constructor did throw:
    ```typescript
    @AfterThrow(on.class./*...*/)
    advice((ctxt: AfterThrowContext, error: Error) {
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             
  - After class constructor dif returb or throw:
    ```typescript
    @After(on.class./*... */)
    advice((ctxt: AfterContext) { /* ... */ }
    ```
- **Property getter advices**
  - Replace property descriptor:
    ```typescript
    @Compile(on.property./*... */)
    advice(ctxt: CompileContext) { /* ... */}
    ```
  - Before property is get:
    ```typescript
    @Before(on.property./*... */)
    advice(ctxt: BeforeContext) { /* ... */}
    ```
  - Around property getter:
    ```typescript
    @Around(on.property./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]) {
        // do something before getter
        const value = jp();   // invoke original getter (eventually)
        // do domething after getter
        return value++;       // return the new value
    }
    ```
  - After property getter did return:
    ```typescript
    @AfterReturn(on.property./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any) {
        return returnValue++; // return a new value 
    }
    ```
  - after property getter did throw:
    ```typescript
    @AfterThrow(on.property./*...*/)
    advice((ctxt: AfterThrowContext, error: Error) {
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             
  - After property getter did return or throw:
    ```typescript
    @After(on.property./*... */)
    advice((ctxt: AfterContext) { /* ... */ }
    ```

- **Property setter advices**
  - Before property is set:
    ```typescript
    @Before(on.property.setter./*... */)
    advice(ctxt: BeforeContext) { /* ... */}
    ```
  - Around property setter:
    ```typescript
    @Around(on.property.setter./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]) {
        // do something before getter
        jp();   // invoke original setter (eventually)
        // do domething after getter
        return value++;       // return the new value
    }
    ```
  - After property setter did return:
    ```typescript
    @AfterReturn(on.property.setter./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any) {
        return returnValue++; // return a new value 
    }
    ```
  - after property setter did throw:
    ```typescript
    @AfterThrow(on.property.setter./*...*/)
    advice((ctxt: AfterThrowContext, error: Error) {
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             
  - After property setter did returned or throw:
    ```typescript
    @After(on.property.setter./*... */)
    advice((ctxt: AfterContext) { /* ... */ }
    ```
- **Method advices**
  - Before method gets called:
    ```typescript
    @Before(on.method./*... */)
    advice(ctxt: BeforeContext) { /* ... */}
    ```
  - Around method call:
    ```typescript
    @Around(on.method./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]) {
        // do something before getter
        jp();   // invoke original method (eventually)
        // do domething after getter
        return value++;       // return the new value
    }
    ```
  - After method did return:
    ```typescript
    @AfterReturn(on.method./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any) {
        return returnValue++; // return a new value 
    }
    ```
  - after method did throw:
    ```typescript
    @AfterThrow(on.method./*...*/)
    advice((ctxt: AfterThrowContext, error: Error) {
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             
  - After method did returned or throw:
    ```typescript
    @After(on.method./*... */)
    advice((ctxt: AfterContext) { /* ... */ }
    ```
- **Parameter advices**
  - Before method with specified parameter gets called:
    ```typescript
    @Before(on.parameter./*... */)
    advice(ctxt: BeforeContext) { /* ... */}
    ```
  - Around method with specified parameter:
    ```typescript
    @Around(on.parameter./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]) {
        // do something before getter
        jp();   // invoke original method (eventually)
        // do domething after getter
        return value++;       // return the new value
    }
    ```
  - After method with specified parameter did return:
    ```typescript
    @AfterReturn(on.parameter./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any) {
        return returnValue++; // return a new value 
    }
    ```
  - after method with specified parameter did throw:
    ```typescript
    @AfterThrow(on.parameter./*...*/)
    advice((ctxt: AfterThrowContext, error: Error) {
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             
  - After method with specified parameter did return or throw
    ```typescript
    @After(on.parameter./*... */)
    advice((ctxt: AfterContext) { /* ... */ }
    ```

### Enable an aspect

Aspects are not picked up automatically,
meaning that you have the choice to enhance or not to enhance your classes with aspects.

The magic happens when you configure a `Weaver` to load the aspect, as follows: 
```js
import { getWeaver } from '@aspectjs/core';

getWeaver() // get the global weaver instance
    .enable(new MyAspect());    // enable the aspect
```

It is important you do the weaver configuration before you apply any annotation aspect.
Once configured, or once an annotation has been applied, the weaver configuration cannot be changed anymore. 
