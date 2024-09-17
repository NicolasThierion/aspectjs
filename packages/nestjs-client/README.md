# nestjs-client

> Give your NestJS controller a nice, clean HTTP client with zero additional code 🎉 !

[![ci-status]](https://gitlab.com/aspectjs/nestjs-client)
[![coverage report]](https://gitlab.com/aspectjs/nestjs-client/-/commits/main)
[![Latest Release]](https://gitlab.com/aspectjs/nestjs-client/-/releases)

## 💡 Why?

Maintaining an HTTP client every time your web API changes can be tedious and error-prone. Why should a _NestJS_ controller and its corresponding client have completely different codebases when they share the same API?


<ul style="display: flex; justify-content: space-around; flex-flow: row wrap; list-style-type: none">
<li style="min-width: 300px">
Http client

```ts

interface User {
    id: string;
    name: string;
}

export class UserClient {
    
    async getAll(name: string): Promise<User[]> {
        return fetch(`${baseUrl}/users?name=${name}`);
    } 

    async getById(id: number): User {
        return fetch(`${baseUrl}/users/${id}`);
    } 
    createOne(user: User): void {
        return fetch(`${baseUrl}/users`, {
            method: 'POST',
            body: user
        });
    } 
}
```

</li>
<li>
NestJS controller

```ts
import {
    Controller,
    Get,
    Post,
    Query,
    Param,
    Body
} from `@nestjs/common`

interface User {
    id: string;
    name: string;
}
@Controller('users')
export class UserController {
    @Get()
    getAll(@Query('name') name?: string): User[] {
        //...
    } 
    @Get(':id')
    getById(@Param('id') id: number): User {
        //...
    } 
    @Post()
    createOne(@Body() user: User): void {
        //...
    } 
}
```

</li>
</ul>

Inspired by the [retrofit](https://square.github.io/retrofit/) java library,
`nestjs-client` use the _same decorators_ from your existing NestJS controller to give you a corresponding implementation of an http client.
By leveraging [AspectJS](https://www.npmjs.com/package/@aspectjs/core) and the [`httyped-client`](https://www.npmjs.com/package/httyped-client), this library simplifies the creation of synchronized clients, reducing redundancy and ensuring your client always reflects your server-side API.


<ul style="display: flex; justify-content: space-around; flex-flow: row wrap; list-style-type: none">
<li style="min-width: 300px">
Http client

```ts
import {
    Get,
    Post,
    Query,
    Param,
    Body
} from `@aspectjs/nestjs/common`
import { abstract } from `@aspectjs/common/utils`

interface User {
    id: string;
    name: string;
}

export abstract class UsersApi {
    @Get()
    getAll(@Query('name') name?: string): User[] {
        return abstract([User])
    } 
    @Get(':id')
    getById(@Param('id') id: number): User {
        return abstract(User)
    } 
    @Post()
    createOne(@Body() user: User): void {
        return abstract<void>()
    } 
}

@HttypedClient('users')
export class UserClient extends UserApi {
}
```

</li>
<li>
NestJS controller

```ts
import {
    Get,
    Post,
    Query,
    Param,
    Body
} from `@aspectjs/nestjs/common`

@Controller('users')
export class UserController extends UserApi {
    getAll(@Query('name') name?: string): User[] {
        return 
    } 
    getById(@Param('id') id: number): User {
        //...
    } 
    createOne(@Body() user: User): void {
        //...
    } 
}
```

</li>
</ul>

## 🚀 Getting started:

- Install the packages.
  ```bash
  npm i @aspectjs/core @aspectjs/common @aspectjs/nestjs nestjs-client
  ```
  
  To use on nodeJS, you may also need a implementation for the fetch api: 
  ```bash
  npm i whatwg-fetch
  ```

- Create an **empty API class**, using only the annotations from `@aspectjs/nestjs/common` and the `abstract` placeholder from `@aspectjs/common/utils`.

  ```ts
  // users.api.ts
  
  import {
      Get,
      Post,
      Query,
      Param,
      Body
  } from `@aspectjs/nestjs/common`
  
  
  export abstract class UsersApi {
    @Get()
    getAll(@Query('name') name?: string): User[] {
      return abstract([User])
    } 
    @Get(':id')
    getById(@Param('id') id: number): User {
      return abstract(User)
    } 
    @Post()
    createOne(@Body() user: User): void {
      return abstract<void>()
    } 
  }
  
  ```
  
  > **Note:**
  > - Annotations from the package `@aspectjs/nestjs/common` share the same signature as those from `@nestjs/common`.
  > - TypeScript does not support decorators on interfaces. Instead, we use abstract classes. The `abstract()` value returned by the method serves as a placeholder, allowing TypeScript to properly infer the actual return type and helping `httyped-client` select the appropriate response mapper.

- Create an Http client class, annotated with the `@NestClient()` annotation, that extends the api class: 
  ```ts
  // users.client.ts
  import { NestClient } from 'nest-client';

  @NestClient('users')
  export class UsersClient extends UsersApi {
  }
  ```

- Let your NestJS controller extend the _API_ class 
  ```ts
  // users.controller.ts
  import {
    Controller,
    Get,
    Post,
    Query,
    Param,
    Body
  } from `@aspectjs/nestjs/common`

  @Controller('users')
  export class UsersController extends UsersApi {
     @Get()
      getAll(@Query('name') name?: string): User[] {
        // ...
      } 
      @Get(':id')
      getById(@Param('id') id: number): User {
        // ...
      } 
      @Post()
      createOne(@Body() user: User): void {
        // ...
      } 
  }
  ```
- On your server code, enable the `NestClient` aspect to give annotations from `@aspectjs/nestjs/common` the same behavior as the original decorators.

```ts
import 'whatwg-fetch';
import { getWeaver } from '@aspectjs/core';
import { NestClientAspect } from 'nestjs-client';

getWeaver().enable(new NestClientAspect());
```

Great! Now, you're ready to use the http client created with `@NestClient`:

```ts
const usersClient = new NestClientFactory({
    baseUrl: 'http://localhost:3000',
  })
    .addRequestHandler((r) => console.log(`[${r.method}] ${r.url}`))
    .create(UsersClient);

await usersClient.getById(1)
```


[coverage report]: https://gitlab.com/aspectjs/nestjs-client/badges/main/coverage.svg?job=memo:unit
[ci-status]: https://gitlab.com/aspectjs/nestjs-client/badges/main/pipeline.svg
[Latest Release]: https://gitlab.com/aspectjs/nestjs-client/-/badges/release.svg
