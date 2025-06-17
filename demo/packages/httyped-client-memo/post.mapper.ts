import { Mapper } from "httyped-client";
import { Post } from "./common/models/post.model";

export const POST_MAPPER: Mapper = {
  typeHint: Post,
  map: (obj: any) => {
    return Object.setPrototypeOf(obj, Post.prototype);
  },
};
