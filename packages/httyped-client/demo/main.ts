import 'reflect-metadata';
import 'whatwg-fetch';
import { HttypedClientFactory } from '../src/public_api';
import { User } from './user.model';
import { UsersApi } from './users.api';
import { UsersClient } from './users.client';

async function main() {
  const usersClient = new UsersClient();

  const user = (await usersClient.find({ username: 'Bret' }))[0]!;
  console.log(user);
  // const posts = (await usersClient.id(1).posts())!;
  // console.log(posts);

  const cf = new HttypedClientFactory({
    baseUrl: 'http://localhost:3000',
  }).addRequestBodyMappers({
    typeHint: User,
    map: (obj: User) => {
      obj.name = obj.name.toUpperCase();
      return obj;
    },
  });

  const localUserApi = cf.create(UsersApi);
  await localUserApi.create(user);
}

main();
