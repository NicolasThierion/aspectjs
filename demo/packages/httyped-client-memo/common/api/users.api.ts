import { abstract } from "@aspectjs/common/utils";
import {
  Body,
  Get,
  HttypedClient,
  PathVariable,
  Post,
  RequestParams,
} from "httyped-client";
import { Post as _Post } from "../models/post.model";
import { User } from "../models/user.model";

@HttypedClient("users")
export abstract class UsersApi {
  @Get()
  async find(@RequestParams() search?: { username?: string }) {
    return abstract([User]);
  }

  @Get(":id")
  async getById(@PathVariable("id") id: number) {
    return abstract(User);
  }

  @Get(":id/posts")
  async getUsersPosts(@PathVariable("id") userId: number) {
    return abstract([_Post]);
  }

  @Post()
  async create(
    @Body()
    user: User
  ) {
    return abstract<void>();
  }
}
