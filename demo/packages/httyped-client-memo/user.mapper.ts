import { Mapper, MapperContext } from "httyped-client";
import { Address } from "./common/models/address.model";
import { Post } from "./common/models/post.model";
import { User } from "./common/models/user.model";

export const USER_MAPPER: Mapper = {
  typeHint: User,
  map: async (obj: any, context: MapperContext) => {
    obj.address =
      context.mappers.findMapper(Address)?.map(obj.address, context) ??
      obj.address;

    if (obj.posts) {
      obj.posts =
        (await context.mappers.findMapper(Post)?.map(obj.posts, context)) ??
        obj.posts;
    }

    return Object.setPrototypeOf(obj, User.prototype);
  },
};
