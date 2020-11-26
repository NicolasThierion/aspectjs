# Abstract
## Why ?

Aspect Oriented programming is a clean way to address cross-cutting concerns, while keeping **strong cohesion**  and **loose coupling**.
Frameworks like [AspectJ](https://www.eclipse.org/aspectj/) changed the way java developers design software,
and allowed the development of quality frameworks that can inter-operate with each other.

Following the same line-up, **@AspectJS** make it is easy to define standard annotations, that can be reused and re-purposed with a limitless count of dynamic aspects. 

## AspectJS vs ES decorators

[ES Decorators](https://github.com/tc39/proposal-decorators) are great, and already allows adding cross-cutting behavior into our code.
However, unlike java annotation that are just empty interfaces, an ES decorator comes with its built-in  behavior, that makes it impossible 
to reuse the decorator do something else.

Let's consider the following `@Sealed()` decorator:
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
and it is up to you to enable (or not) the aspects you want to make these annotations alive.
