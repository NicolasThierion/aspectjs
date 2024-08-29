# Usage

## Client

```ts
@Aspect()
class JsonHttpClientAspect extends HttpClientAspect {
  constructor(config: HttpClientConfig) {
    super(config);
    config.serializer = new TypeHintJsonSerializer();
    config.deserializer = new TypeHintJsonDeserializer();
  }
}

getWeaver();
```

```ts
@HttpClient('/users')
@TypeHint([
  {
    $: User,
    posts: {
      $: Post,
      comments: {
        $: Comment,
      },
    },
  },
])
@TypeHint([User])
// @TypeHint('$[*]', User)
// @TypeHint('$[*].posts[*]', Post)
// @MapperHint('$[*].posts[*].comment[*]', (r) => new Comment(r))
abstract class UsersClient {
  @Get()
  getAll() {
    return [new User()];
  }

  @Get(":id/")
  abstract getOne();
}
```

```ts
class User {
  @JsonProperty('posts', [Post])
  posts: Post[];
}

class Post {
  comments: Comment[];
}

class Comment {
  msg: string;
}
```

## Server

```ts
@HttpMapping("/users")
abstract class UserApi {

  @Get();
  abstract findAll(): User[];

  @Delete("/:id")
  abstract deleteOne(id: number): void;
}
```

```ts
@HttpClient()
class UserClient extends UserApi {
  override findAll(): User[] {
    return [new User()];
  }
}

@HttpResource()
class UserResource extends UserApi {
  override findAll(): User[] {
    return db.find(User);
  }
}
```

## Manager

```ts
@Resource()
class User {
  name: string;
  @TypeHint([Post])
  posts: Posts[];
}

function main() {
  gm = new ResourceManager(Group);
  gm.find(1);
  gm.save(new Group(), { recursive: true });
  gm.each((g: Group) => [g.users, g.users?.posts]).save();

  gm.each((g: Group) => [g.users, g.users?.posts]).find(1);
}
```
