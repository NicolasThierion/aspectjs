import { Around, Aspect, on } from '@aspectjs/core';

import type { AroundContext, JoinPoint } from '@aspectjs/core';
import { Transactional } from './annotations/transactional.annotation';
import { Transaction } from './transaction';
import type {
  DataSourceDefinition,
  TransactionManager,
} from './transaction-manager';
import { TransactionalError } from './transactional-error';

/**
 * Make a method transactional. {@link Transactional} annotation.
 * This class is intended to be subclassed for ORM-specific implementations.
 */
@Aspect('transactional')
export class TransactionalAspect {
  private configured = false;
  /**
   *
   * @param transactionManager The transaction manager to use to create transactions.
   */
  constructor(protected transactionManager: TransactionManager) {}

  configure(...datasources: DataSourceDefinition[]): this {
    if (this.configured) {
      throw new TransactionalError('TransactionalAspect is already installed');
    }
    this.assertNoDuplicatesDatasources(datasources);
    this.transactionManager.configure(datasources);
    this.configured = true;

    return this;
  }

  @Around(on.methods.withAnnotations(Transactional))
  async proceedTransaction(
    context: AroundContext,
    jp: JoinPoint,
    jpArgs: unknown[],
  ) {
    this.assertIsConfigured('call "@Transactional() method"');

    if (this.transactionManager.hasTransaction()) {
      return jp(...jpArgs);
    } else {
      return (await this.createTransaction()).run(
        async (transaction: Transaction) => {
          try {
            const returnedValue = jp(...jpArgs);
            const res = await this.handleReturnedValue(context, returnedValue);

            await transaction.commit();

            return res;
          } catch (error) {
            await transaction.rollback();
            throw error;
          } finally {
            await this.closeTransaction(transaction);
          }
        },
      );
    }
  }
  protected async handleReturnedValue(
    _context: AroundContext,
    returnedValue: unknown,
  ) {
    return Promise.resolve(returnedValue);
  }

  /**
   * Close the transaction
   * @param transaction the transaction to close
   * @returns a promise that is resolved once the transaction has been closed.
   */
  protected closeTransaction(transaction: Transaction) {
    return transaction.close();
  }

  /**
   * Create a new transaction.
   * @returns A promise of the created transaction.
   */
  protected createTransaction(): Promise<Transaction> {
    return this.transactionManager!.createTransaction();
  }

  private assertIsConfigured(operation = 'use the transactional aspect') {
    if (!this.configured) {
      throw new TransactionalError(
        `cannot ${operation}. Transaction manager is not setup. Did you forgot to call the "TransactionalAspect.configure()" method ?`,
      );
    }
  }

  private assertNoDuplicatesDatasources(datasources: DataSourceDefinition[]) {
    const dsNames = new Set<string>(
      datasources.map((datasource) => datasource.name),
    );

    if (dsNames.size !== datasources.length) {
      const duplicateNames = [...dsNames].filter(
        (n) => datasources.map((d) => n === d.name).length > 1,
      );

      throw new Error(
        `multiple datasources with name: ${duplicateNames.join(',')}`,
      );
    }
  }
}
