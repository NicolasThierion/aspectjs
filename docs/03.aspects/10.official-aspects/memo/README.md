# `@Memo`
 > Straightforward memoization

## Summary

`@Memo` is an implementation of the [memoize design pattern](https://en.wikipedia.org/wiki/Memoization) using  AOP. 
When a method is annotated with the `@Memo()` annotation, its return value will be stored in *cache*, 
so that further method call with the same set of parameters returns the cached result instead of invoking the real method. 
This is particular useful for compute-intensive or time-consuming tasks (eg: fetch calls).

By default, both synchronous and asynchronous methods are supported as soon as your environment has access to the [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
and the [IndexedDb API](https://developer.mozilla.org/en-US/docs/Glossary/IndexedDB).

## Installation

<code-group>
<code-block title="YARN">

```bash
yarn add @aspectjs/core
yarn add @aspectjs/memo
```
</code-block>

<code-block title="NPM">

```bash
npm install --save @aspectjs/core
npm install --save @aspectjs/memo
```
</code-block>
</code-group>

## Simple usage

You must enable the `MemoAspect` in order for `@Memo()` to work. 
The simplest way to do is to register the default Memo profile:
 
```javascript
import { MEMO_PROFILE } from "@aspectjs/memo";
MEMO_PROFILE.register();
```

You can now use `@Memo()` annotation to memoize any method:

<code-group>
<code-block title="Javascript">

```js
import { Memo } from '@aspectjs/memo';

class MyMemoizedClass {
    @Memo()
    heavyCompute(arg1, arg2) {
        return [arg1, arg2].join(', ').toUpperCase();
    }
}

const c = new MyMemoizedClass();
c.heavyCompute("hello", "world");   // computes 'HELLO, WORLD'
c.heavyCompute("hello", "world");   // returns cached 'HELLO, WORLD'
```
</code-block>
<code-block title="Typescript">

```typescript
import { Memo } from '@aspectjs/memo';

class MyMemoizedClass {
    @Memo()
    heavyCompute(arg1: string, arg2: string) {
        return [arg1, arg2].join(', ').toUpperCase();
    }
}

const c = new MyMemoizedClass();
c.heavyCompute("hello", "world");   // computes 'HELLO, WORLD'
c.heavyCompute("hello", "world");   // returns cached 'HELLO, WORLD'
```
</code-block>
</code-group>

> ![info] The aspect computes a pseudo-unique hash based on the method name, the class ID and the method arguments. 
> This hash is used as a key to store and retrieve the memoized data.

[info]: ../../../../.README/picto/12px/info.png
[tip]: ../../../../.README/picto/12px/success.png
[danger]: ../../../../.README/picto/12px/danger.png
[pipeline]: ../../../../packages/memo/.README/memo-pipeline.png

