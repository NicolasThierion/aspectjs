# `@Memo`

`@Memo` intent to implement the [memoize design pattern](https://en.wikipedia.org/wiki/Memoization) 
on any method annotated with the `@Memo` annotation.

A method with the `@Memo` annotation is able to memoize the return value given set of parameter, 
and is perfectly suited  for implementing a cheap cache for data that do not change too often.

## Installation

::: tab with npm
```
npm install @aspectjs/memo
```
:::
::: tab with yarn
```
yarn add @aspectjs/memo
```
:::
::::

## Simple usage

::: tab ES6+
```js
import { Memo } from '@aspectjs/memo/default';

class SomeClass {
    @Memo()
    heavyCompute(arg1, arg2) {
        return [arg1, arg2].join(', ').toUpperCase();
    }
}

const c = new SomeClass();
c.heavyCompute("hello", "world");   // computes 'HELLO, WORLD'
c.heavyCompute("hello", "world");   // returns cached 'HELLO, WORLD'
```
:::
::: Typescript

```typescript
import { Memo } from '@aspectjs/memo/default';

class SomeClass {
    @Memo()
    heavyCompute(arg1: string, arg2: string) {
        return [arg1, arg2].join(', ').toUpperCase();
    }
}

const c = new SomeClass();
c.heavyCompute("hello", "world");   // computes 'HELLO, WORLD'
c.heavyCompute("hello", "world");   // returns cached 'HELLO, WORLD'
```
:::
::::

Import `@Memo` annotation from `@aspectjs/memo/default` to load default aspect profile.

The default aspect profile ...



## Features
- synchronous or asynchronous
- fast data compression
- cache expiry