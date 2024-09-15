---
icon: database
---

# @aspectjs/persistence

## Why ?

Inspired by the [Java Persistence API](https://docs.oracle.com/javaee/6/tutorial/doc/bnbpz.html), **@aspectjs/persistence** is an attempt to bring standardized persistence annotations to javascript. At the moment, different ORM libraries libraries like [typeorm](https://typeorm.io/) or [mikro orm](https://mikro-orm.io/) bring their own ES decorators to the Object-Relationnal mapping. Altough the decorators are very similar, you cannot switch from one implementation to another without reworking your codebase.

With **@aspectjs/persistence**, persistence libraries could rely on a standardized API that makes it possible to seamlessly build code on top of it, regardless of the implementation.

At the moment though, the project only offers a `@Transactional()` annotation, that integrates with _typeorm_.

## Installation

```bash
npm i @aspectjs/persistence
```

## @Transactional()

- Enable the `TransactionalAspect`

**aop.ts**

```ts
import { getWeaver } from '@aspectjs/core';
import { TypeOrmTransactionalAspect } from '@aspectjs/persistence/typeorm';
import { DATASOURCE } from './datasource.ts';

getWeaver().enable(new TypeOrmTransactionalAspect().configure(DATASOURCE));
```

**datasource.ts**

```ts
import { DataSource } from 'typeorm';

export const DATASOURCE = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  entities: [User, Post],
  synchronize: true,
  ...options,
});

//   DATASOURCE.initialize();
```

- Declare a transactional method

```ts
import { DATASOURCE } from './datasource.ts';

export class UsersService {
  em = DATASOURCE.manager;
  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  @Transactional()
  async save(user: User) {
    await this.em.save(user);
    for (const post of user.posts) {
      await this.em.save(post);
    }
  }
}
```

## Usage with NestJS

**app.module.ts**

```ts
import { getWeaver } from '@aspectjs/core';
import { TypeOrmTransactionalAspect } from '@aspectjs/persistence/typeorm';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';
import { UsersModule } from './users/users.module';
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory() {
        return {
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'user',
          password: 'password',
          database: 'database',
          entities: [
            /* ... */
          ],
        };
      },
      async dataSourceFactory(options) {
        const ds = new DataSource(options!);
        getWeaver().enable(new TypeOrmTransactionalAspect().configure(ds));
        return ds;
      },
    }),
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

**users.service.ts**

```ts
import { Transactional } from '@aspectjs/persistence';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(User)
    private postsRepository: Repository<Post>,
  ) {}

  @Transactional()
  async save(user: User) {
    await this.usersRepository.save(u);
    for (const post of user.posts) {
      await this.postsRepository.save(post);
    }
  }
}
```
