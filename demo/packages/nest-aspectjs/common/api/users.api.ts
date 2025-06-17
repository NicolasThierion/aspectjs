import { abstract } from '@aspectjs/common/utils';
import { Body, Get, Param, Post, Query } from '@aspectjs/nestjs/common';
import { Post as _Post } from '../models/post.model';
import { User } from '../models/user.model';

export abstract class UsersApi {
  @Get()
  async find(@Query('username') username?: string) {
    return abstract([User]);
  }

  @Get(':id')
  async getById(@Param('id') id: number) {
    return abstract(User);
  }

  @Get(':id/posts')
  async getUsersPosts(@Param('id') userId: number) {
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
