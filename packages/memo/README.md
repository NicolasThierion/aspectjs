# `@Memo`

> Straightforward memoization

[![ci-status]](https://gitlab.com/Pryum/aspectjs)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Abstract

`@Memo` is an implementation of the [memoize design pattern](https://en.wikipedia.org/wiki/Memoization) using AOP.
When a method is annotated with the `@Memo()` annotation, its return value will be stored in _cache_,
so that further method call with the same set of parameters returns the cached result instead of invoking the real method.
This is particular useful for compute-intensive or time-consuming tasks (eg: fetch calls).

For more details & usage, please [read the documentation](https://nicolasthierion.github.io/aspectjs/03.aspects/10.official-aspects/memo/)

## Installation

```bash
npm install --save @aspectjs/core
npm install --save @aspectjs/memo
```

## Simple usage

You must enable the `MemoAspect` in order for `@Memo()` to work.
The simplest way to do is to register the default Memo profile:

```javascript
import { MEMO_PROFILE } from '@aspectjs/memo';
MEMO_PROFILE.register();
```

You can now use `@Memo()` annotation to memoize any method:

```js
import { Memo } from '@aspectjs/memo';

class MyMemoizedClass {
    @Memo()
    heavyCompute(arg1, arg2) {
        return [arg1, arg2].join(', ').toUpperCase();
    }

    @Memo()
    heavyComputePeople(firstName, lastName) {
        // this also works for non-primitive objects,
        // but you need the @Cacheable() annotation above custom classes
        return new People(firstName, lastName.toUpperCase());
    }
}

@Cacheable()
class People {
    constructor(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
}

const c = new MyMemoizedClass();
c.heavyCompute('hello', 'world'); // computes 'HELLO, WORLD'
c.heavyCompute('hello', 'world'); // returns cached 'HELLO, WORLD'

c.heavyComputePeople('John', 'Doe'); // computes People {'John DOE'}
c.heavyComputePeople('John', 'Doe'); // returns cached People {'John DOE'}
```

MIT Licensed

[ci-status]: https://gitlab.com/Pryum/aspectjs/badges/master/pipeline.svg
