import { Mapper } from '../src/types/mapper.type';
import { Post } from './post.model';

export const POST_MAPPER: Mapper = {
  typeHint: Post,
  map: (obj: any) => {
    return Object.setPrototypeOf(obj, Post.prototype);
  },
};
