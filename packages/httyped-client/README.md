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
  async find(@RequestParams() search?: { username?: string }) {
    return abstract([User]);
  }

  @Get(':id')
  async getById(@PathVariable('id') id: number) {
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

## 🏁 Getting started:

- Install the package

  ```bash
  npm i @aspectjs/core @aspectjs/common httyped-client
  ```

  HttypedClient uses the [`fetch api`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). Node users may also want to install a fetch implementation (eg: [whatwg-fetch](https://www.npmjs.com/package/whatwg-fetch))

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
    async find(@RequestParams() search?: { username?: string }) {
      return abstract<User[]>();
    }

    @Get(':id')
    async getById(@PathVariable('id') id: number) {
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

## ⚙️ Documentation:

### Configuration

The `HttypedClientFactory` accepts the following configuration:

```ts
export interface HttypedClientConfig {
  /**
   * The base url of all requests (eg: host plus base route)
   */
  baseUrl: string;
  /**
   * A set of options passed to every requests
   *
   * default: {}
   */
  requestInit?: RequestInit;
  /**
   * The fetch implementation to use. Default: native fetch
   */
  fetchAdapter?: FetchAdapter;
  /**
   * A list of request handlers.
   */
  requestHandlers?: RequestHandler[];
  /**
   * A list of response handlers.
   */
  responseHandlers?: ResponseHandler[];
  /**
   * Responses body can be mapped with these mappers
   */
  responseBodyMappers?: MappersRegistry;
  /**
   * Requests body can be mapped with these mappers
   */
  requestBodyMappers?: MappersRegistry;
  /**
   * Used to customize how path variables are handled
   */
  pathVariablesHandler?: PathVariablesHandler;
  /**
   * Used to customize how request parameters are handled
   */
  requestParamsHandler?: RequestParamsHandler;
}
```

> **info** By default, an http client is configured to send request with `Content-Type: application/json` & to try to parse a response as _json_.

This configuration is inherited in all clients created through the factory, but most parameters can be overriden on a class basis.

### Mappers

HttypedClientFactory can be configured with mappers for the request body & response body.

```ts
httypedClientFacroty.addResponseBodyMappers({
  typeHint: User,
  map: (obj: UserDTO, context: MapperContext) => {
    obj.address = obj.address = context.findMapper(Address).map(obj.address, context);
    return obj;
  },
  {
  typeHint: "Address", // typeHint can be specified as a class or as a string
  map: (obj: AddressDTO, context: MapperContext) => {
    return new Address(obj);
  },
})
export interface Mapper<T = unknown, U = unknown> {
  typeHint: TypeHintType | TypeHintType[];
  map(obj: T, context: MapperContext): U;
}
```

In this example, whenever an httypedclient interface returns a User or an array of User, the json response will be mapped automatically.

> **info**
>
> - Mappers can be synchronous or asynchronous.
> - Mappers are called for each items of an array of the corresponding type

### Annotations

You can use these annotations to design your apis:

| Annotation                                   | Kind            | Description                                      |
| -------------------------------------------- | --------------- | ------------------------------------------------ |
| `HttypedClient(url?: string)`                | CLASS           | Define a class as an httyped-client              |
| `Get(path?: string)`                         | METHOD          | Define a method as a "GET" endppoint             |
| `Post(path?: string)`                        | METHOD          | Define a method as a "POST" endppoint            |
| `Put(path?: string)`                         | METHOD          | Define a method as a "PUT" endppoint             |
| `Delete(path?: string)`                      | METHOD          | Define a method as a "DELETE" endppoint          |
| `Patch(path?: string)`                       | METHOD          | Define a method as a "PATCH" endppoint           |
| `Options(path?: string)`                     | METHOD          | Define a method as a "OPTIONS" endppoint         |
| `Head(path?: string)`                        | METHOD          | Define a method as a "HEAD" endppoint            |
| `Body(contentType?: string)`                 | PARAMETER       | Use an argument as the request body              |
| `RequestParam(name: string)`                 | PARAMETER       | Add that argument to the search parameters       |
| `RequestParams(params: Record<string, any>)` | PARAMETER       | Use that argument as a set of search parameters  |
| `PathVariable(name: string)`                 | PARAMETER       | Replace a variable in the url with this argument |
| `Header(name: string)`                       | CLASS \| METHOD | Define an HTTP header                            |
| `Headers()`                                  | CLASS \| METHOD | Define a set of HTTP headers                     |

> **info** HttypedClient supports inheritance. Annotations of the parent class will be merged into the child class configuration

<!--

## 🔗 Documentation

For more advanced usage, please read the documentation: [https://httyped-client.gitlab.io/](https://httyped-client.gitlab.io/).


-->

MIT Licensed

[coverage report]: https://gitlab.com/httyped-client/badges/main/coverage.svg?job=coverage
[ci-status]: https://gitlab.com/httyped-client/badges/main/pipeline.svg
[Latest Release]: https://gitlab.com/httyped-client/-/badges/release.svg
[npm version]: https://img.shields.io/npm/v/httyped-client.svg
[license]: https://img.shields.io/npm/l/httyped-client.svg
[NPM Downloads]: https://img.shields.io/npm/dm/httyped-client.svg

[bundlejs]: https://deno.bundlejs.com/badge?q=httyped-client,@aspectjs/core&treeshake=[*],[*]
