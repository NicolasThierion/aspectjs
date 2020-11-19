# `@Memo`

## Summary

`@Memo` is an AOP implementation of the [memoize design pattern](https://en.wikipedia.org/wiki/Memoization).
For given parameters, the result of a method invocation annotated with the `@Memo` annotation is stored in cache, 
so that further method call returns the cached result instead of invoking the real method. 
This is particular useful for compute-intensive of time-consuming tasks (eg: fetch calls).

By default, both synchronous and asynchronous methods are supported as soon as your environment has access to the [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
and the [IndexedDb API](https://developer.mozilla.org/en-US/docs/Glossary/IndexedDB).

## Installation

:::: tabs
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

You must enable the `MemoAspect` in order for `@Memo` to work. 
The simplest way to do is to register the default Memo profile: 
```typescript
import "packages/memo/register/register";
```

This imports the `@Memo` annotation, and enables the default `WeaverProfile` for this annotation as well.

:::: tabs
::: tab ES6+
```js
import { Memo } from 'packages/memo/register/register';

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
:::
::: tab Typescript
```typescript
import { Memo } from 'packages/memo/register/register';

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
:::
::::

> ![info] The aspect computes a pseudo-unique hash based on the method name, the class ID and the method arguments. 
> This hash is used as a key to store and retrieve the memoized data.

The `defaultMemoProfile` configures the `@Memo` aspect with the `LsMemoDriver` and the `IdbMemoDriver`
that respectively store memoized data into `LocalStorage` and `IndexedDb`.

### `@Cacheable` annotation

The `MemoAspect` comes configured with a `MemoDriver` that supports memoization of several common types: `number`, `string`, `Promise`, `Object`, ...
The aspect keeps track of the type signature before memoization, and ensures values returned from the cache are then inflated into the proper type. 
However, if you try to memoize an instance of your own classes, the aspect won't recognize the type and will throw an error.

In a nutshell, adding the `@Cacheable` annotation onto your own class registers a `MemoMarshaller` that is able to handle the annotated class:

```typescript
import { Cacheable } from '@aspectjs/memo';

@Cacheable()
class MyCustomClass {}

class MyMemoizedClass {
    @Memo()
    getCustomClass() {
        return new MyCustomClass();
    }
}
```

> ![tip] You can also add support to other types by adding several custom `MemoMarshaller` implementations.

#### CacheableOptions
The `@Cacheable` annotation accepts an attribute of type `CacheableOptions`:

```typescript
export interface CacheableOptions {
    /** Identifies the type of object to be cached. If not provided, a typeId should is generated automatically **/
    typeId?: string;
    /** Any entry of the @Cacheable object with a different version is evicted from the cache. Supports SemVer versioning **/
    version?: string | number | (() => string | number);
}
```

## Advanced Usage

### Using a custom weaver profile

The default profile should work out-of-the-box for modern browsers, and supports a set of basic types. 
If you want to extend its behavior, change some parameters or use different drivers,
you can rather import the `@Memo` annotation from `@aspectjs/memo` and enable a custom profile:
```typescript
import { getWeaver } from '@aspectjs/core'

getWeaver().enable(
            new MemoAspect().drivers( /* configure drivers */),
            new DefaultCacheableAspect(), /* enable @Cacheable annotation */
        )
```

### @Memo parameters
The `@Memo` annotation supports several parameters: 

```typescript
export interface MemoOptions extends MemoAspectOptions {
    driver?: string | typeof MemoDriver;
    namespace?: string | (() => string);
    expiration?: Date | number | (() => Date | number);
    id?: string | number | ((ctxt: BeforeContext<any, any>) => string | number);
    createMemoKey?: (ctxt: BeforeContext<any, any>) => MemoKey | string;
}
```

:::details driver
 ```typescript
type  driver = string | typeof MemoDriver;
`````
 Specifies the preferred memo driver for this method. Must be either a driver ID, or a driver class.
 ```typescript
  class MyMemoizedClass {
        @Memo({
            driver: 'localStorage',
        })
        synchronousProcess(...args: any[]): any {
             /* ... */
        }
        @Memo({
            driver: 'indexedDb',
        })
        asynchronousProcess(...args: any[]): any {
             /* ... */
        }
    }
 ```
 > ![info] If you do not specify the driver, MemoAspect will pick the driver best suited for the given returned type.    

 > ![danger] Some drivers like `IndexedDb` only support asynchronous methods, 
 > and will throw an error if the method returns some non-async value.
:::

:::details namespace
```typescript
type namespace = string | (() => string);
```
Sometimes, you don't want two identical method call to memoize data that will collide with each other.
For example, if your application is aware of another user to be logged-in, but this user is not used in method signature, 
you will want the users to use their own namespace. 

 ```typescript
  class MyMemoizedClass {
        @Memo({
            namespace: () => 'user1',
        })
        userAwareMemo(...args: any[]): any {
             /* ... */
        }
    }
 ```
:::

:::details expiration
```typescript
type expiration = Date | number | (() => Date | number);
```
Set how many time the memoized data should be kept.
Can either be a number of seconds, or a precise date.

When the specified moment expires, the memoized data will be automatically garbage-collected.

 ```typescript
  class MyMemoizedClass {
        @Memo({
            expiration: 60 * 10, // 10 minutes
        })
        userAwareMemo(...args: any[]): any {
             /* ... */
        }
    }
 ```
:::

:::details id
```typescript
type id = string | number | ((ctxt: BeforeContext<any, any>) => string | number);
```

`MemoAspect` stores memoized data per class instance. 
That is, if a class has a *memoized* method, and you create several instances of this class, 
each instance will store its own copy of the memoized data.

To identify class instances, `MemoAspect` assumes the presence of one of the following attributes : `id` | `_id` | `hashcode` | `_hashcode`.
If none of these attributes are not set, a random id one will be assigned. 
While the random ID works well if you work with singleton instances, it may cause issues if you want memoize across multiple instances of the same class.
In these case, you may want to specify the `id` parameter to provide your own function/value that identifies instances from each other.

 ```typescript
  class MyMemoizedClass {
      @Memo({
          id: (ctxt: BeforeContext) => ctxt.instance._ref,
      })
      process(...args: any[]): any {
             /* ... */
      }
  }
 ```
:::

:::details createMemoKey
```typescript
type createMemoKey = (ctxt: BeforeContext<any, any>) => MemoKey;
```

`MemoAspect` will keep track of methods calls and their respective returned value. 
By default, a specific key is computed for each call, using a hash-sum of the following values:
 - the class name
 - the method name 
 - the arguments
This way, any subsequent identical method call can retrieve the memoized value.
You can override the default key formula with the `createMemoKey` parameter:
```typescript
 class MyMemoizedClass {
      @Memo({
        createMemoKey: (ctxt: BeforeContext<any, any>) => {
            return new MemoKey({
                namespace: ctxt.data.namespace,
                instanceId: ctxt.data.instanceId,
                argsKey: ctxt.args,
                targetKey: ctxt.target.ref,
            });
        }      
      })
      process(...args: any[]): any {
             /* ... */
      }
  }
```
:::

## The memo pipeline

![pipeline]

## Memo drivers

`MemoAspect` needs to store the memoized data into some storage API. 
This is done through the `MemoDriver`, which provide a standardized API to store both sync and async data.

The driver itself is not tight to any storage API, and it requires a concrete implementation. At the moment, here are the available drivers.

- ### `LsMemoDriver`

Stores data into the [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). Accepts a custom `localStorage` implementation (eg: polyfills for NodeJS), as well as a serializer.
By default, it is configured to use `LzMemoSerializer` that compresses data with [lz-string](https://www.npmjs.com/package/lz-string) before storage.

- ### `IdbMemoDriver`

Stores data into the [`indexedDb`](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). Accepts a custom `indexedDb` implementation (eg: polyfills for NodeJS).

> ![info] Because the data type must be known with no delay, some parts of the `MemoFrame` are stored synchronously with `LsMemoDriver` under the hood.

## MemoMarshaller

A value stored by `MemoAspect` gets serialized and loose its type (eg: a `Date` stored into `localStorage` is stored into a string).
Before serialization to occur, the object gets *marshalled* into a `MemoFrame` that retain the value along with its intrinsic type.
This transformation is has to be type-specific, and is done by a `MemoMarshaller`.
The following marshallers are supported out of the box:
 - **basic types** (`number`, `boolean`, `null`, ...)
 - **arrays**
 - **dates**
 - **promises**
 - **objects**
 - **cacheable objects**, that handles classes annotated with `@Cacheable`

If you store an object and none of the configured marshaller is applicable, the driver will throw an error.


## Features
- synchronous or asynchronous
- fast data compression
- cache expiration

[info]: ../../.README/picto/12px/info.png
[tip]: ../../.README/picto/12px/success.png
[danger]: ../../.README/picto/12px/danger.png
[pipeline]: ./.README/memo-pipeline.png
