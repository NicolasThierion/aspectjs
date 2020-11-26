# Advice Contexts

Each advice gets provided with an `AdviceContext` that gives useful data related to the current execution point.
The type of `AdviceContext` is determined by the advice phase, as well as the advice type,  
but all include a subset of the following generic `AdviceContext` :

```typescript
import { Advice, AdviceType, 
    AnnotationsBundle, JoinPoint,
    AdviceTarget 
} from '@aspectjs/core/commons'

// AdviceType = AdviceType.CLASS | AdviceType.PROPERTY \
//              | AdviceType.METHOD | AdviceType.PARAMETER
interface AdviceContext<TClass, A extends AdviceType> {
    /** The applied advice **/
    readonly advice: Advice<TClass, A>;
    /** The annotations contexts **/
    readonly annotations: AnnotationsBundle<TClass>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance?: TClass;
    /** The value originally returned by the joinpoint **/
    value?: unknown;
    /** the arguments originally passed to the joinpoint **/
    readonly args?: unknown[];
    /** The error originally thrown by the joinpoint **/
    error?: Error;
    /** Hold the original method, 
      bound to its execution context and it original parameters **/
    readonly joinpoint?: JoinPoint;
    /** The symbol targeted by this advice
     (class, method, property or parameter **/
    readonly target: AdviceTarget<TClass, A>;
    /** any data set by the advices, shared across
      all advice going through this execution context **/
    readonly data: Record<string, any>;
}
```

> ![danger] Based on the advice phase, an advice may or may use some values. 
> Eg, `context.error` is only available in `@AfterThrow` advices, 
> while `context.instance` is available in all advices but `@Before` a class constructor 

## `CompileContext`

```typescript
interface CompileContext<TClass, A extends AdviceType> {
    /** The applied advice **/
    readonly advice: Advice<TClass, A>;
    /** The annotations contexts **/
    readonly annotations: AnnotationsBundle<TClass>;
    /** The symbol targeted by this advice
     (class, method, property or parameter **/
    readonly target: AdviceTarget<TClass, A>;
    /** any data set by the advices, shared across
      all advice going through this execution context **/
    readonly data: Record<string, any>;
}
```

- ### on classes
    ```typescript
    @Compile(on.class./*... */)
    advice(ctxt: CompileContext<TClass, AdviceType.CLASS>): Function | PropertyDescriptor | undefined { 
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
    }
    ```
  
- ### on property getters / setter
    ```typescript
    @Compile(on.property./*... */)
    advice(ctxt: CompileContext<TClass, AdviceType.PROPERTY>): PropertyDescriptor | undefined { 
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
    }
    ```
    > ![info] This advice can define a new `PropertyDescriptor` that defines both property getter and property setter.

## `BeforeContext`

```typescript
export interface BeforeContext<T = unknown, A extends AdviceType = any> {
    /** The applied advice **/
    readonly advice: Advice<TClass, A>;
    /** The annotations contexts **/
    readonly annotations: AnnotationsBundle<TClass>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance?: TClass;
    /** the arguments originally passed to the joinpoint **/
    readonly args?: unknown[];
    /** The symbol targeted by this advice
     (class, method, property or parameter **/
    readonly target: AdviceTarget<TClass, A>;
    /** any data set by the advices, shared across
      all advice going through this execution context **/
    readonly data: Record<string, any>;
}
```

- ### on classes
    > Called before class constructor gets called.
    ```typescript
    @Before(on.class./*... */)
    advice(ctxt: BeforeContext<TClass, AdviceType.CLASS>): void {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
    }    
    ```

    > ![danger] `context.instance` is not available in `@Before` class advices.

- ### on property getters
    > Called before property gets read.
    ```typescript
    @Before(on.property./*... */)
    advice(ctxt: BeforeContext<TClass, AdviceType.CLASS>): void {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
    }    
    ```

- ### on property setters
    > Called before property is set.
    ```typescript
    @Before(on.property.setter./*... */)
    advice(ctxt: BeforeContext<TClass, AdviceType.CLASS>): void {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
    }    
    ```

- ### on methods
    > Called before method gets called
    ```typescript
    @Before(on.method./*... */)
    advice(ctxt: BeforeContext<TClass, AdviceType.CLASS>): void {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
    }
    ```

- ### on methods parameters
    >alled before method with specified parameter gets called.
    ```typescript
    @Before(on.parameter./*... */)
    advice(ctxt: BeforeContext<TClass, AdviceType.CLASS>): void {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
    }
    ```

## `AroundContext`

```typescript
interface AroundContext<TClass, A extends AdviceType> {
    /** The applied advice **/
    readonly advice: Advice<TClass, A>;
    /** The annotations contexts **/
    readonly annotations: AnnotationsBundle<TClass>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance?: TClass;
    /** the arguments originally passed to the joinpoint **/
    readonly args?: unknown[];
    /** Hold the original method, 
      bound to its execution context and it original parameters **/
    readonly joinpoint?: JoinPoint;
    /** The symbol targeted by this advice
     (class, method, property or parameter **/
    readonly target: AdviceTarget<TClass, A>;
    /** any data set by the advices, shared across
      all advice going through this execution context **/
    readonly data: Record<string, any>;
}
```
> ![info] The Around advices are called with `joinpoint` as second argument, that is the same as `context.joinpoint`.

> ![info] Calling the joinpoint function without arguments will by default pass the original arguments.
> You can replace the original arguments by passing an array to the joinpoint. 

- ### on classes
    ```typescript
    @Around(on.class./*... */)
    advice(ctxt: AroundContext<TClass, AdviceType.CLASS>,
           jp: Joinpoint,
           jpArgs: any[]): any {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        // do something before constructor
        const instance = jp(jpArgs); // invoke original constructor (eventually)
        // do domething after constructor
        return instance;
    }
    ```
    Called around class constructor.
    You may or may not call the joinpoint to invoke the original constructor. 

    > ![danger] If you call the joinpoint, you cannot reference `context.instance` before calling it. 

- ### on property getters
    > Called around a property getter.
    ```typescript
    @Around(on.property./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]): any {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        // do something before getter
        const result = jp(jpArgs); // invoke original getter (eventually)
        // do domething after getter
        return result + 1;       // return a new value
    }
    ```
- ### on property setters
    > Called around a property setter.
    ```typescript
    @Around(on.property.setter./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]): any {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
       // do something before setter
        jp(jpArgs); // invoke original setter (eventually)
        // do domething after setter
    }
    ```

- ### on methods
    > Called around method call.
    ```typescript
    @Around(on.method./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]) {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        // do something before getter
        const result = jp(jpArgs);   // invoke original method (eventually)
        // do domething after getter
        return result + 1;       // return a new value
    }
    ```
 
- ### on methods parameters
    > Called around method with specified parameter:
    ```typescript
    @Around(on.parameter./*... */)
    advice(ctxt: AroundContext, jp: Joinpoint, jpArgs: any[]) {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        // do something before getter
        jp();   // invoke original method (eventually)
        // do domething after getter
        return value++;       // return the new value
    }
    ```

## `AfterReturnContext`

```typescript
interface AdviceReturnContext<TClass, A extends AdviceType> {
    /** The applied advice **/
    readonly advice: Advice<TClass, A>;
    /** The annotations contexts **/
    readonly annotations: AnnotationsBundle<TClass>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance?: TClass;
    /** the arguments originally passed to the joinpoint **/
    readonly args?: unknown[];
    /** The value originally returned by the joinpoint **/
    readonly value: any;
    /** The symbol targeted by this advice
     (class, method, property or parameter **/
    readonly target: AdviceTarget<TClass, A>;
    /** any data set by the advices, shared across
      all advice going through this execution context **/
    readonly data: Record<string, any>;
}
```
> ![info] The after advices are called with `returnValue` as second argument, that is the same as `context.value`.

- ### on classes
    > Called after class constructor returns.
    ```typescript
    @AfterReturn(on.class./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any): any {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        return returnValue++; // return a new value 
    }
    ```

- ### on property getters
    > Called after a property has been read.
    ```typescript
    @AfterReturn(on.property./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any): any {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        return returnValue++; // return a new value 
    }
    ```

- ### on property setters
    > Called after a property has been set.
    ```typescript
    @AfterReturn(on.property.setter./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any): any {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        return returnValue++; // return a new value 
    }
    ```

- ### on methods
    > Called after method did return.
    ```typescript
    @AfterReturn(on.method./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any) {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        return returnValue++; // return a new value 
    }
    ```

- ### on methods parameters
    > Called after method with specified parameter did return.
    ```typescript
    @AfterReturn(on.parameter./*... */)
    advice(ctxt: AfterReturnContext, returnValue: any) {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        return returnValue++; // return a new value 
    }
    ```

## `AfterThrowContext`

> ![info] The AfterThrow advices are called with `error` as second argument, that is the same as `context.error`.

- ### on classes
    > Called after class constructor throws.
    ```typescript
    @AfterThrow(on.class./*...*/)
    advice((ctxt: AfterThrowContext, error: Error): any {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             

- ### on property getters
    > Called after property getter throws.
    ```typescript
    @AfterThrow(on.property./*...*/)
    advice((ctxt: AfterThrowContext, error: Error): any {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             

- ### on property setters
    > Called after class setter throws.
    ```typescript
    @AfterThrow(on.property./*...*/)
    advice((ctxt: AfterThrowContext, error: Error): any {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             

- ### on methods
    > Called after method did throw.
    ```typescript
    @AfterThrow(on.method./*...*/)
    advice((ctxt: AfterThrowContext, error: Error) {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             
- ### on methods parameters
    > Called after method with specified parameter did throw.
    ```typescript
    @AfterThrow(on.parameter./*...*/)
    advice((ctxt: AfterThrowContext, error: Error) {
        console.log(`calling ${ctxt.advice} on ${ctxt.target.label}`);
        console.error(error.message); // handle the error
        // do not throw => swallows the error
    }
     ```             

## `AfterContext`
```typescript
interface AdviceReturnContext<TClass, A extends AdviceType> {
    /** The applied advice **/
    readonly advice: Advice<TClass, A>;
    /** The annotations contexts **/
    readonly annotations: AnnotationsBundle<TClass>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance?: TClass;
    /** the arguments originally passed to the joinpoint **/
    readonly args?: unknown[];
    /** The symbol targeted by this advice
     (class, method, property or parameter **/
    readonly target: AdviceTarget<TClass, A>;
    /** any data set by the advices, shared across
      all advice going through this execution context **/
    readonly data: Record<string, any>;
}
```
- ### on classes
    > Called after class constructor throws or returns normally.
    ```typescript
    @After(on.class./*... */)
    advice((ctxt: AfterContext): void { /* ... */ }
    ```

- ### on property getters
    > Called after property getter throws or returns normally.
    ```typescript
    @After(on.property./*... */)
    advice((ctxt: AfterContext): void { /* ... */ }
    ```

- ### on property setters
    > Called after property setter throws or returns normally.
    ```typescript
    @After(on.property.setter./*... */)
    advice((ctxt: AfterContext): void { /* ... */ }
    ```
    
- ### on methods
    > Called after method did return or throw.
    ```typescript
    @After(on.method./*... */)
    advice((ctxt: AfterContext) { /* ... */ }
    ```
    
- ### on methods parameters
    > Called after method with specified parameter did return or throw
    ```typescript
    @After(on.parameter./*... */)
    advice((ctxt: AfterContext) { /* ... */ }
    ```  

[danger]: ../../.README/picto/12px/danger.png
[info]: ../../.README/picto/12px/info.png
