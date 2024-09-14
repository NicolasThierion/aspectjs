import 'reflect-metadata';
import 'whatwg-fetch';
import { HttypedClientFactory } from '../src/client-factory/client.factory';
import { Address, User, UsersApi } from './users.api';

async function main() {
  const usersApi = new HttypedClientFactory({
    baseUrl: 'https://jsonplaceholder.typicode.com',
  })
    .addRequestHandler((r) => console.log(`[${r.method}] ${r.url}`))
    .addResponseBodyMappers({
      typeHint: User,
      map: (obj: any) => {
        Object.setPrototypeOf(obj.address, Address.prototype);
        return Object.setPrototypeOf(obj, User.prototype);
      },
    })
    .create(UsersApi);

  const user = (await usersApi.searchByUserName('Bret'))[0]!;
  console.log(user.address.print());
}

main();
