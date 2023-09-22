import { execSync } from 'child_process';

import portfinder from 'portfinder';

import path from 'path';

export interface Db {
  id: number;
  port: number;
  host: string;
  username: string;
  password: string;
  database: string;
  teardown: () => void;
}
const baseContainerName = 'aspectjs_orm_db';
let id = 0;

export interface DbOptions {
  database?: string;
  port?: number;
}
export async function initDb(dbOptions?: DbOptions): Promise<Db> {
  const port = await portfinder.getPortPromise({
    port: 25432,
  });
  const options = {
    database: `aspectjs_orm_db`,
    port: port,
    ...dbOptions,
  };
  const containerName = `${baseContainerName}_${new Date()
    .valueOf()
    .toString()}`;
  const password = 'password';
  const username = 'username';
  const initdb = path.join(__dirname, 'initdb');
  const dockerCmd =
    `docker run -d --rm ` +
    `-v ${initdb}:/docker-entrypoint-initdb.d:ro ` +
    `-p ${options.port}:5432 ` +
    `-e POSTGRES_PASSWORD=${password} ` +
    `-e POSTGRES_USER=${username} -e POSTGRES_DB=${options.database} ` +
    `--name ${containerName} ` +
    `postgres && sleep 5`;
  execSync(dockerCmd, {
    stdio: 'inherit',
  });

  const db = {
    id,
    port,
    host: 'localhost',
    username,
    password,
    database: options.database,
    teardown: () => {
      execSync(`docker rm -f ${containerName} `, { stdio: 'inherit' });
    },
  } satisfies Db;
  id++;
  return db;
}
