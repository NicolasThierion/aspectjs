import { Transaction } from './transaction';

export interface DataSourceDefinition<T = unknown> {
  name: string;
  dataSource: T;
}

export interface TransactionManager {
  hasTransaction(): boolean;
  createTransaction(): Promise<Transaction>;
  configure(ds: DataSourceDefinition[]): this;
}
