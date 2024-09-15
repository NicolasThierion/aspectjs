import { Mapper, MapperContext } from '../src/types/mapper.type';
import { Address } from './address.model';
import { httyped } from './client-factory.global';
import { Post } from './post.model';
import { User } from './user.model';
import { UsersApi } from './users.api';

export const USER_MAPPER: Mapper = {
  typeHint: User,
  map: async (obj: any, context: MapperContext) => {
    obj.address =
      context.mappers.findMapper(Address)?.map(obj.address, context) ??
      obj.address;

    if (!obj.posts) {
      obj.posts = await httyped.create(UsersApi).getUsersPosts(obj.id);
    } else {
      obj.posts =
        (await context.mappers.findMapper(Post)?.map(obj.posts, context)) ??
        obj.posts;
    }

    return Object.setPrototypeOf(obj, User.prototype);
  },
};
