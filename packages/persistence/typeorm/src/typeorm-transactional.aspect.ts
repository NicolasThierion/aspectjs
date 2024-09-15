import { TransactionalAspect, TransactionManager } from '@aspectjs/persistence';
import { DataSource } from 'typeorm';
import { TypeOrmDataSourceDefinition } from './typeorm-datasource-definition';
import { TypeOrmTransactionManager } from './typeorm-transaction-manager';

export class TypeOrmTransactionalAspect extends TransactionalAspect {
  declare readonly transactionManager: TransactionManager;
  constructor(
    transactionManager: TransactionManager = new TypeOrmTransactionManager(),
  ) {
    super(transactionManager);
  }

  override configure(
    ...dataSources: (DataSource | TypeOrmDataSourceDefinition)[]
  ): this;
  override configure(...dataSources: TypeOrmDataSourceDefinition[]): this;
  override configure(
    ...dataSources: (DataSource | TypeOrmDataSourceDefinition)[]
  ) {
    return super.configure(...createDataSourceDefinition(dataSources));
  }
}

function createDataSourceDefinition(
  dataSources: (DataSource | TypeOrmDataSourceDefinition)[],
): TypeOrmDataSourceDefinition[] {
  return dataSources.map((ds) => {
    return (ds as TypeOrmDataSourceDefinition).dataSource
      ? (ds as TypeOrmDataSourceDefinition)
      : ({
          dataSource: ds as DataSource,
          name: 'default',
        } satisfies TypeOrmDataSourceDefinition);
  });
}
