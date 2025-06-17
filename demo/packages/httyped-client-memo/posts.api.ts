import { abstract } from "@aspectjs/common/utils";
import { Get, HttypedClient, TypeHint } from "httyped-client";
import { Post } from "./common/models/post.model";

@HttypedClient("posts")
export abstract class PostsApi {
  @Get()
  @TypeHint([Post])
  getAll() {
    return abstract<Post[]>();
  }
}
