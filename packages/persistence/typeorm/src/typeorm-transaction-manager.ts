import {
  Transaction,
  TransactionManager,
  TransactionalError,
} from '@aspectjs/persistence';
import { DataSource, EntityManager } from 'typeorm';
import { TypeOrmDataSourceDefinition } from './typeorm-datasource-definition';
import { TransactionsRegistry } from './typeorm-transaction-registry';

import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<string>();

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

let globaltransactionCount = 0;

export class TypeOrmTransactionManager implements TransactionManager {
  private readonly transactions = new TransactionsRegistry();
  private configured = false;
  private dataSourceDefinitions?: TypeOrmDataSourceDefinition[];

  /**
   * Patches the global typeorm transactionManager with a proxy to trap method calls,
   * and replaces them with their transactional counterpart if executed from a transactional context.
   * @returns
   */
  configure(dataSourceDefinitions: TypeOrmDataSourceDefinition[]) {
    if (this.configured) {
      throw new TransactionalError('TransactionManager is already installed');
    }

    this.dataSourceDefinitions = dataSourceDefinitions;
    this.dataSourceDefinitions.forEach((dd) =>
      this.patchDataSourceEntityManager(dd.name, dd.dataSource),
    );
    this.configured = true;
    return this;
  }

  /**
   *
   * @returns true if called from within a transactional context.
   */
  hasTransaction(): boolean {
    const transactionId = asyncLocalStorage.getStore();
    return transactionId
      ? !!this.transactions.getTransaction(transactionId)
      : false;
  }

  /**
   *
   * @returns the transaction corresponding to the current transactional context. Throws an error if called outside a transactional context.
   */
  getTransaction(): Transaction {
    if (!this.hasTransaction()) {
      throw new TransactionalError('No transaction is opened');
    }
    this.assertIsConfigured(
      'call "TypeOrmTransactionManager.getTransaction()"',
    );
    return this.transactions.getTransaction(asyncLocalStorage.getStore()!)!;
  }

  async createTransaction(): Promise<Transaction> {
    this.assertIsConfigured(
      'call "TypeOrmTransactionManager.createTransaction()"',
    );

    const rollbackFns: (() => Promise<void>)[] = [];
    const commitFns: (() => Promise<void>)[] = [];
    const closeFns: (() => Promise<void>)[] = [];
    const transactionId = `TypeOrmTransaction#${globaltransactionCount++}`;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    const transaction: Transaction = {
      rollback(): Promise<void> {
        return Promise.all(rollbackFns.map((f) => f())).then();
      },
      commit(): Promise<void> {
        return Promise.all(commitFns.map((f) => f())).then();
      },
      async close(): Promise<void> {
        await Promise.all(closeFns.map((f) => f())).then();

        _this.transactions.remove(transactionId);
      },
      run<T = void>(
        fn: (transaction: Transaction) => T | Promise<T>,
      ): Promise<T> {
        return asyncLocalStorage.run(transactionId, async () => fn(this));
      },
    };

    for (const dd of this.dataSourceDefinitions!) {
      const queryRunner = await dd.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      rollbackFns.push(() => queryRunner.rollbackTransaction());
      commitFns.push(() => queryRunner.commitTransaction());
      closeFns.push(() => queryRunner.release());
      this.transactions.registerTransactions(transactionId, transaction);
      this.transactions.registerManager(
        transactionId,
        dd.name,
        queryRunner.manager,
      );
    }

    return transaction;
  }

  private assertIsConfigured(operation = 'use the transactionManager') {
    if (!this.configured) {
      throw new TransactionalError(
        `cannot ${operation}. Transaction manager is not setup. Did you forgot to call the "configure()" method ?`,
      );
    }
  }

  private patchDataSourceEntityManager(
    name: string,
    dataSource: DataSource,
  ): void {
    (dataSource as Writeable<DataSource>).manager = new Proxy(
      dataSource.manager,
      {
        get: (target, key) => {
          return (this.getCurrentEntityManager(name) ?? (target as any))[key];
        },
      },
    );
  }

  private getCurrentEntityManager(name: string): EntityManager | undefined {
    return this.transactions.getManager(asyncLocalStorage.getStore(), name);
  }
}
