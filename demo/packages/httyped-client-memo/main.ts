import "reflect-metadata";
import "whatwg-fetch";
import "./aop";

import { UsersClient } from "./users.client";

async function main() {
  // create a memoized userClient with the hemp of httyped-client and the @Memo annotation.
  const usersClient = new UsersClient();

  // Fetch first user once.
  let user0 = (await usersClient.find({ username: "Bret" }))[0];
  console.log(user0.sayHello()); // ensure user is properly fetched & mapped with USER_MAPPER

  const t = new Date().getTime();

  // as usersClient is memoized, calling the method several times with same arguments is instant
  for (let i = 0; i < 100; ++i) {
    user0 = (await usersClient.find({ username: "Bret" }))[0];
  }
  console.log(`Elapsed time : ${new Date().getTime() - t} ms`);
  console.log(user0.sayHello()); // user0 is still there

  // fetching a new user
  let user1 = (await usersClient.find({ username: "Antonette" }))[0];
  console.log(user1.sayHello()); // ensure user is properly fetched & mapped with USER_MAPPER

  const posts1 = await usersClient.id(user1.id).posts();
  console.log(`Number of posts: ${posts1.length}`);
}

main();
