import { abstract } from '@aspectjs/common/utils';
import { TypeHint } from '../src/annotations/type.annotation';
import { Get, HttypedClient } from '../src/public_api';
import { Post } from './post.model';

@HttypedClient('posts')
export abstract class PostsApi {
  @Get()
  @TypeHint([Post])
  getAll() {
    return abstract<Post[]>();
  }
}
