import { DataSourceDefinition } from '@aspectjs/persistence';
import { DataSource } from 'typeorm';

export interface TypeOrmDataSourceDefinition
  extends DataSourceDefinition<DataSource> {}
