import { abstract } from '@aspectjs/common/utils';
import { PathVariable } from '../src/annotations/path-variable.annotation';
import { TypeHint } from '../src/annotations/type.annotation';
import { Get, HttypedClient, RequestParams } from '../src/public_api';
import { Post } from './post.model';
import { User } from './user.model';

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

  @Get(':id/posts')
  getUsersPosts(@PathVariable('id') userId: number) {
    return abstract([Post]);
  }
}
