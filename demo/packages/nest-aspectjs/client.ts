import { NestClientFactory } from 'nestjs-httyped-client';
import './aop';
import { UsersClient } from './common/api/users.client';

async function main() {
  const client = new NestClientFactory({
    baseUrl: 'http://localhost:3000',
  })
    .addRequestHandler((r) => {
      console.log(r.method, r.url);
    })
    .create(UsersClient);

  console.log(await client.find('j'));
}

main();
