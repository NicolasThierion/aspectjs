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
class UsersResource {
  @Get()
  getAll() {
    return [new User()];
  }
}
```

```ts
class User {
  // @TypeHint([Post])
  @JsonProperty('posts', [Post])
  posts: Post[];
}

class Post {
  @TypeHint([Comment])
  comments: Comment[];
}

class Comment {
  msg: string;
}
```
