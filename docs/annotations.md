# Annotations
 

An **annotation** is basically an [ES8 decorators stage 1](https://github.com/tc39/proposal-decorators) without any behavior.
Its purpose is to be a pointcut for the weaver to bind advices to. 

There are four types of annotations:
 - `ClassAnnotation`
 - `MethodAnnotation`
 - `ParameterAnnotation`
 - `PropertyAnnotation`

An annotation is identified by its name, as well as a namespace, 
so there is no ambiguity between two annotations of different libraries with the same name.   

#### Create an annotation

Creating new annotations is done with the `AnnotationFactory`.
<!-- tabs:start -->
##### **ES6+**
```js
import { AnnotationFactory } from '@aspectjs/core';
const factory = new AnnotationFactory('my-project-namespace');

const MyAnnotation = factory.create(
    function MyAnnotation(param1, param2) { /* empty body */}
);

@MyAnnotation('string', 0)
class Data {
}
```
##### **Typescript**
```typescript
import { AnnotationFactory } from '@aspectjs/core';

const factory = new AnnotationFactory('my-project-namespace');
const MyAnnotation = factory.create(
    function MyAnnotation(
                param1: string,
                param2: number): ClassDecorator { return; }
);

@MyAnnotation('string', 0)
class Data {
}
```
> ![info] The annotation stub signature must return a `ClassDecorator` to let typescript to allow calling the annotation like a class decorator.
<!-- tabs:end -->

`AnnotationFactory` takes a mandatory `groupId` parameter, that you can set to what you want to identify your project.
