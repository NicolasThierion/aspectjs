import { Memo } from "@aspectjs/memo";
import { httyped } from "./client-factory.global";
import { UsersApi } from "./common/api/users.api";

export class UsersClient {
  private readonly usersApi = httyped.create(UsersApi);

  @Memo({
    expires: 10,
  })
  find(search?: { username?: string }) {
    return this.usersApi.find(search);
  }

  @Memo()
  id(id: number) {
    return {
      posts: () => this.usersApi.getUsersPosts(id),
      find: () => this.usersApi.getById(id),
    };
  }
}
