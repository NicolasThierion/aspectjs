import { abstract } from '@aspectjs/common/utils';
import { Body } from '../src/annotations/body.annotation';
import { Get } from '../src/annotations/fetch/get.annotation';
import { Post } from '../src/annotations/fetch/post.annotation';
import { HttypedClient } from '../src/annotations/http-client.annotation';
import { PathVariable } from '../src/annotations/path-variable.annotation';
import { RequestParams } from '../src/annotations/request-params.annotation';
import { Post as _Post } from './post.model';
import { User } from './user.model';

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

  @Get(':id/posts')
  async getUsersPosts(@PathVariable('id') userId: number) {
    return abstract([_Post]);
  }

  @Post()
  async create(
    @Body()
    user: User,
  ) {
    return abstract<void>();
  }
}
