# @aspectjs/memo

@aspectjs/memo is a project that enables memoization of methods using a simple `@Memo()` annotation.

## Memoization

Memoization is a technique used in computer programming to optimize the execution time of a function by caching its results for a given set of inputs. When a function is memoized, the first time it is called with specific arguments, the result is computed and stored in memory. Subsequent calls to the same function with the same arguments retrieve the cached result instead of re-executing the function.

**main.ts**

```ts
import { getWeaver } from '@aspectjs/core';
import { Memo, MemoAspect } from '@aspectjs/memo';

getWeaver().enable(new MemoAspect());

export class Demo {
  static fibonacci(num: number) {
    if (num < 2) {
      return num;
    } else {
      return Math.fibonacci(num - 1) + Math.fibonacci(num - 2);
    }
  }
  @Memo()
  static memoizedFibonacci(num: number) {
    if (num < 2) {
      return num;
    } else {
      return Math.memoizedFibonacci(num - 1) + Math.memoizedFibonacci(num - 2);
    }
  }
}

function main() {
  let [time, result] = getExecutionTime(() => Demo.fibonacci(40));
  console.log(`Demo.fibonacci(40) returned ${result} after ${time} ms`);
  // Demo.fibonacci(40) returned 102334155 after 999 ms

  [time, result] = getExecutionTime(() => Demo.memoizedFibonacci(40));
  console.log(`Demo.memoizedFibonacci(40) returned ${result} after ${time} ms`);
  // Demo.memoizedFibonacci(40) returned 102334155 after 12 ms

  [time, result] = getExecutionTime(() => Demo.memoizedFibonacci(40));
  console.log(`Demo.memoizedFibonacci(40) returned ${result} after ${time} ms`);
  // Demo.memoizedFibonacci(40) returned 102334155 after 0 ms
}

function getExecutionTime(fn: () => unknown) {
  let t = new Date().getTime();
  let result = fn();
  let elapsedTime = new Date().getTime() - t;
  return [elapsedTime, result];
}

main();
```

Memoization is based on the assumption that a function will produce the same result for the same set of inputs. By caching the result, subsequent calls can be avoided, reducing the computational overhead. This technique is particularly effective when a function is called multiple times with the same arguments, as it eliminates redundant computations.

## <i class="fa fa-wrench"/> Installation

```sh
npm i @aspectjs/core @aspectjs/common @aspectjs/memo
```

## <i class="fa fa-book"/> Usage

Memoization can be achieved by enabling the `MemoAspect` aspect. This aspect enables memoization by intercepting methods marked with the `@Memo()` annotation.

- Enable the `MemoAspect`
  **aop.ts**

  ```ts
  import { getWeaver } from '@aspectjs/core';
  import { MemoAspect } from '@aspectjs/memo';

  getWeaver().enable(new MemoAspect());
  ```

- Annotate a method with the `@Memo()` annotation
  **users.resource.ts**

  ```ts
  import { Memo } from '@aspectjs/memo';

  export class UsersResource {
    @Memo()
    fetchOne(id: number) {
      console.log(`fetching user with id=${1}`);
      return fetch(`https://jsonplaceholder.typicode.com/users/${1}`).then(
        (r) => r.json(),
      );
    }
  }
  ```

- Call the memoized method

  ```ts
  async function main() {
    const users = new UsersResource();

    console.log((await users.fetchOne(1)).name);
    console.log((await users.fetchOne(1)).name);
  }

  main();
  ```

  Output:

  ```sh
  fetching user with id=1
  # method UsersResource.fetchOne returned after 76ms
  Leanne Graham
  # method UsersResource.fetchOne returned after 0ms
  Leanne Graham
  ```
