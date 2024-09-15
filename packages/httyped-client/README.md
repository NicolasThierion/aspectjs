# httyped-client

<h3 align="center">An AOP powered, typesafe http client</p>

<p align="center">

[![ci-status]](https://gitlab.com/aspectjs/httyped-client)
[![coverage report]](https://gitlab.com/aspectjs/httyped-client/-/commits/main)
[![npm version]](https://www.npmjs.com/package/httyped-client)
[![license]](https://www.npmjs.com/package/httyped-client)
[![NPM Downloads]](https://www.npmjs.com/package/httyped-client)
[![bundlejs]](https://bundlejs.com/?q=httyped-client&treeshake=[*]%2C[*])
[![Latest Release]](https://gitlab.com/aspectjs/httyped-client/-/releases)

</p><br/><br/>

## 📜 Abstract

Inspired by the [retrofit](https://square.github.io/retrofit/) java library,
**httyped-client** uses **[AspectJS](https://github.com/NicolasThierion/aspectjs)** to design HTTP clients with only annotations (and few lines of code).

## 🚀 Why?

Writing HTTP clients is not particularly difficult, but it's not exactly fun either.

However, in almost every project, we spend time doing the same repetitive tasks: concatenating URLs with request parameters, transforming search parameters, and mapping requests and responses from/to domain models...
This can become quite tedious and time-consuming.

With **httyped-client**, you can design your clients **declaratively** using **[AspectJS](https://github.com/NicolasThierion/aspectjs)** annotations.

```ts
import { abstract } from '@aspectjs/common/utils';
import {
  Get,
  HttypedClient,
  RequestParams,
  PathVariable,
} from 'httyped-client';

@HttypedClient('users')
export abstract class UsersApi {
  @Get()
  find(@RequestParams() search?: { username?: string }) {
    return abstract([User]);
  }

  @Get(':id')
  getById(@PathVariable('id') id: number) {
    return abstract(User);
  }
}

const usersApi = new HttypedClientFactory({
  baseUrl: 'https://jsonplaceholder.typicode.com',
}).create(UsersApi);

await userApi.getById(1);
```

_httyped-client_ takes care of the following for you:

- Concatenating URLs with request and search parameters
- Request and response mapping
- Calling the [`fetch` API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## ⚙️ Usage:

- Install the package
  ```bash
  npm i @aspectjs/core @aspectjs/common httyped-client
  ```
- Configure your `HttypedClientFactory`:

  ```ts
  import { HttypedClientFactory, MapperContext } from 'httyped-client';

  // httyped-client.config.ts
  export const httyped = new HttypedClientFactory({
    baseUrl: 'https://jsonplaceholder.typicode.com',
  })
    // log every request
    .addRequestHandler((r) => console.log(`[${r.method}] ${r.url}`))
    // automatically map responses of type Address or Address[]
    .addResponseBodyMappers(
      {
        typeHint: Address,
        map: (obj: any) => new Address(obj),
      },
      // automatically map responses of type User or User[]
      {
        typeHint: User,
        map: async (obj: any, context: MapperContext) => {
          obj.address = context.mappers
            .findMapper(Address)!
            .map(obj.address, context);
          return new User(obj);
        },
      },
    );
  ```

- Declare an httyped client:

  ```ts
  // users.client.ts
  import { abstract } from '@aspectjs/common/utils';
  import {
    PathVariable,
    Get,
    HttypedClient,
    RequestParams,
  } from 'httyped-client';

  @HttypedClient('users')
  export abstract class UsersApi {
    @Get()
    @TypeHint([User])
    find(@RequestParams() search?: { username?: string }) {
      return abstract<User[]>();
    }

    @Get(':id')
    getById(@PathVariable('id') id: number) {
      return abstract(User);
    }
  }
  ```

- Create an instance of the httyped client, and use it 🎉

  ```ts
  main.ts;
  const usersClient = httyped.create(UsersClient);
  const users = await usersClient.find({ name: 'John' });
  ```

## 🔗 Documentation

For more advanced usage, please read the documentation: [https://httyped-client.gitlab.io/](https://httyped-client.gitlab.io/).

MIT Licensed

[coverage report]: https://gitlab.com/httyped-client/badges/main/coverage.svg?job=coverage
[ci-status]: https://gitlab.com/httyped-client/badges/main/pipeline.svg
[Latest Release]: https://gitlab.com/httyped-client/-/badges/release.svg
[npm version]: https://img.shields.io/npm/v/httyped-client.svg
[license]: https://img.shields.io/npm/l/httyped-client.svg
[NPM Downloads]: https://img.shields.io/npm/dm/httyped-client.svg

[bundlejs]: https://deno.bundlejs.com/badge?q=httyped-client,@aspectjs/core&treeshake=[*],[*]
