import 'reflect-metadata';
import 'whatwg-fetch';
import { UsersClient } from './users.client';

async function main() {
  const usersClient = new UsersClient();

  const user = (await usersClient.find({ username: 'Bret' }))[0]!;
  console.log(user);
  // const posts = (await usersClient.id(1).posts())!;
  // console.log(posts);
}

main();
