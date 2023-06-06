---
icon: rotate-left
---

# Memo

## Memoization

Memoization is a technique used in computer programming to optimize the execution time of a function by caching its results for a given set of inputs. When a function is memoized, the first time it is called with specific arguments, the result is computed and stored in memory. Subsequent calls to the same function with the same arguments retrieve the cached result instead of re-executing the function. This can significantly improve performance, especially for computationally expensive or time-consuming functions.

Memoization is based on the assumption that a function will produce the same result for the same set of inputs. By caching the result, subsequent calls can be avoided, reducing the computational overhead. This technique is particularly effective when a function is called multiple times with the same arguments, as it eliminates redundant computations.

## Installation

```sh
npm i @aspectjs/core @aspectjs/common @aspectjs/memo
```

## Usage

Memoization can be achieved by enabling the `MemoAspect` aspect. This aspect enables memoization by intercepting methods marked with the `@Memo` annotation.

- Enable the `MemoAspect`
  :::code-tabs
  @tab aop.ts

  ```ts
  import { getWeaver } from '@aspectjs/core';
  import { MemoAspect } from '@aspectjs/memo';

  getWeaver().enable(new MemoAspect());
  ```

  :::

- Annotate a method with the `@Memo()` annotation
  :::code-tabs
  @tab users.resource.ts

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

  :::

- Call the memoized method
  :::code-tabs
  @tab main.ts

  ```ts
  async function main() {
    const users = new UsersResource();

    console.log((await users.fetchOne(1)).name);
    console.log((await users.fetchOne(1)).name);
  }

  main();
  ```

  :::

  Output:

  ```sh
  fetching user with id=1
  # method UsersResource.fetchOne returned after 76ms
  Leanne Graham
  # method UsersResource.fetchOne returned after 0ms
  Leanne Graham
  ```
