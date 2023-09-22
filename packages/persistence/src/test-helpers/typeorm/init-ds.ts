import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Post } from './post.entity';
import { User } from './user.entity';

export const createDataSource = async (
  options: Partial<PostgresConnectionOptions>,
) => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    entities: [User, Post],
    synchronize: true,
    ...options,
  });

  await dataSource.initialize();
  await dataSource.query('DELETE FROM User_');
  await dataSource.query('DELETE FROM Post');
  return dataSource;
};
