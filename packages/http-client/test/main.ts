import 'whatwg-fetch';
import './aop';
import { UsersApi } from './users.api';

async function main() {
  const usersApi = new UsersApi();
  const user = await usersApi.getOne(1);
  console.log(user);
}

main();
