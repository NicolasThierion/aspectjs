import 'whatwg-fetch';
import { HttypedClientFactory } from '../src/client-factory/client.factory';
import './aop';
import { UsersApi } from './users.api';
console.log('Hello ts-node');

async function main() {
  const usersApi = new HttypedClientFactory({
    baseUrl: 'https://jsonplaceholder.typicode.com',
  }).create(UsersApi);
  const user = await usersApi.getOne(1);
  console.log(user);
}

main();
