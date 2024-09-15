import { httyped } from './client-factory.global';
import { UsersApi } from './users.api';

export class UsersClient {
  private readonly usersApi = httyped.create(UsersApi);

  find(search?: { username?: string }) {
    return this.usersApi.find(search);
  }

  id(id: number) {
    return {
      posts: () => this.usersApi.getUsersPosts(id),
      find: () => this.usersApi.getById(id),
    };
  }
}
