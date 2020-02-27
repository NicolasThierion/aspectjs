# Aspects
 
### Create an aspect

An @AspectJS aspect is a class with the `@Aspect()` annotation. 
```js
import { on } from '@aspectjs/core';

@Aspect('someUniqueId') // Optional id
class MyAspect {

    @Before(on.class.withAnnotations(MyAnnotation))
    beforeMyAnnotationClassAdvice(ctxt) {
    }
}
```
>![info] An Aspect may specifies an ID. If so, it will override any aspect already configured with the same ID.

### Enable an aspect

Aspects are not picked up automatically,
meaning that you have the choice to enhance or not to enhance your classes with aspects.

The magic happens when you configure a `Weaver` to load the aspect, as follows: 
```js
import { getWeaver } from '@aspectjs/core';

getWeaver() // get the global weaver instance
    .enable(new MyAspect());    // enable the aspect
```

> ![danger] You should do the weaver configuration before you apply any annotation aspect.
Once configured, or once an annotation has been applied, the weaver configuration cannot be changed anymore. 

The `@Before` decorator used in the example above configures a pointcut on all classes annotated with `@MyAnnotation`.
The following pointcut are supported: 
 - `@Compile`
 - `@Before`
 - `@Around`
 - `@AfterReturn`
 - `@AfterThrow`
 - `@After`

An **advice** is a method of an **aspect** annotated with one of the aforementioned pointcut annotation.

An advice is called within an **AdviceContext**, that is always provided as 1st parameter.

### AdviceContext
```typescript
type AdviceContext<A extends AnnotationType> = {
    annotation?: AnnotationContext<unknown, A>;
    instance?: unknown;
    value?: unknown;
    args?: unknown[];
    error?: Error;
    joinpoint?: JoinPoint;
    target: AnnotationTarget<any, A>;
};
```

> ![danger] Based on the pointcut type, an advice may or may not return a value, the shape of AdviceContext will vary.

Here is a list of all the pointcut you can configure:

#### Class advices

- ##### `@Compile`
    ```typescript
    @Compile(on.class./*... */)
    advice(ctxt: CompileContext): Function { 
        /* ... */
    }
    ```
    Replaces the class constructor.
    > ![danger] Multiple `@Compile` advices on the same pointcut will always override each other. 
    
- ##### `@Before`
    ```typescript
    @Before(on.class./*... */)
    advice(ctxt: BeforeContext): void { /* ... */}    
    ```
    Applied before class constructor gets called.

    > ![danger] `context.instance` is not available in `@Before` class advices.

- ##### `@Around`
    ```typescript
    @Around(on.class./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]): any {
        // do something before constructor
        const instance = jp(); // invoke original constructor (eventually)
        // do domething after constructor
        return instance;
    }
    ```
    Applied around class constructor.
    You may or may not call the joinpoint to invoke the original constructor. 
    > ![info] Calling the joinpoint without arguments will by default pass the original arguments.
    > You can replace arguments by passing an array to the joinpoint. 

    > ![danger] If you call the joinpoint, you cannot reference `context.instance` before calling it. 
   
- ##### `@AfterReturn`
    ```typescript
    @AfterReturn(on.class./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any): any {
        return returnValue++; // return a new value 
    }
    ```
    Called after class constructor returns.
    > ![info] `context.value` and `returnValue` are the same.

- ##### `@AfterThrow`
    ```typescript
    @AfterThrow(on.class./*...*/)
    advice((ctxt: AfterThrowContext, error: Error): any {
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             
    Called after class constructor throws.
    > ![info] `context.error` and `error` are the same.

    > ![info] If an `@AfterThrow` advice do not throws itself, 
    > it will swallow the original exception.

- ##### `@After`
    ```typescript
    @After(on.class./*... */)
    advice((ctxt: AfterContext): void { /* ... */ }
    ```
    Called after class constructor throws or returns normally.

#### Property getter advices

- ##### `@Compile`
    ```typescript
    @Compile(on.property./*... */)
    advice(ctxt: CompileContext): Function { 
        /* ... */
    }
    ```
    Replace property descriptor. 
    > ![info] This advice can both act on property getter and property setter.

    > ![danger] Multiple `@Compile` advices on the same pointcut will always override each other. 
    
- ##### `@Before`
    ```typescript
    @Before(on.property./*... */)
    advice(ctxt: BeforeContext): void { /* ... */}    
    ```
    Applied before property gets read.

- ##### `@Around`
    ```typescript
    @Around(on.property./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]): any {
        // do something before getter
        const result = jp(); // invoke original getter (eventually)
        // do domething after getter
        return result;
    }
    ```
    Applied around a property getter.
    
    > ![info] Calling the joinpoint without arguments will by default pass the original arguments.
    > You can replace arguments by passing an array to the joinpoint. 
    
- ##### `@AfterReturn`
    ```typescript
    @AfterReturn(on.property./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any): any {
        return returnValue++; // return a new value 
    }
    ```
    Called after a property has been read.
    
    > ![info] `context.value` and `returnValue` are the same.

- ##### `@AfterThrow`
    ```typescript
    @AfterThrow(on.property./*...*/)
    advice((ctxt: AfterThrowContext, error: Error): any {
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             
    Called after class getter throws.
    > ![info] `context.error` and `error` are the same.

    > ![info] If an `@AfterThrow` advice do not throws itself, 
    > it will swallow the original exception.

- ##### `@After`
    ```typescript
    @After(on.property./*... */)
    advice((ctxt: AfterContext): void { /* ... */ }
    ```
    Called after property getter throws or returns normally.

#### Property getter advices

- ##### `@Compile`
    ```typescript
    @Compile(on.property.setter./*... */)
    advice(ctxt: CompileContext): Function { 
        /* ... */
    }
    ```
    Replace property descriptor. 
    > ![info] This advice can both act on property getter and property setter.

    > ![danger] Multiple `@Compile` advices on the same pointcut will always override each other. 
    
- ##### `@Before`
    ```typescript
    @Before(on.property.setter./*... */)
    advice(ctxt: BeforeContext): void { /* ... */}    
    ```
    Applied before property is set.

- ##### `@Around`
    ```typescript
    @Around(on.property.setter./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]): any {
        // do something before setter
        const result = jp(); // invoke original setter (eventually)
        // do domething after setter
        return result;
    }
    ```
    Applied around a property setter.
    
    > ![info] Calling the joinpoint without arguments will by default pass the original arguments.
    > You can replace arguments by passing an array to the joinpoint. 
    
- ##### `@AfterReturn`
    ```typescript
    @AfterReturn(on.property.setter./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any): any {
        return returnValue++; // return a new value 
    }
    ```
    Called after a property has been set.
    
    > ![info] `context.value` and `returnValue` are the same.

- ##### `@AfterThrow`
    ```typescript
    @AfterThrow(on.property./*...*/)
    advice((ctxt: AfterThrowContext, error: Error): any {
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             
    Called after class setter throws.
    > ![info] `context.error` and `error` are the same.

    > ![info] If an `@AfterThrow` advice do not throws itself, 
    > it will swallow the original exception.

- ##### `@After`
    ```typescript
    @After(on.property.setter./*... */)
    advice((ctxt: AfterContext): void { /* ... */ }
    ```
    Called after property setter throws or returns normally.

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



[info]: .README/info.png
[danger]: .README/danger.png
