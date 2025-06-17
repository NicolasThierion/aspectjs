import { HttypedClientFactory } from 'httyped-client';
import { ADDRESS_MAPPER } from './address.mapper';
import { POST_MAPPER } from './post.mapper';
import { USER_MAPPER } from './user.mapper';

export const httyped = new HttypedClientFactory({
  baseUrl: 'https://jsonplaceholder.typicode.com',
})
  .addRequestHandler((r) => console.log(`[${r.method}] ${r.url}`))
  .addResponseBodyMappers(USER_MAPPER, POST_MAPPER, ADDRESS_MAPPER);
