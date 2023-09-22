import { Transaction } from '@aspectjs/persistence';
import { EntityManager } from 'typeorm';

export class TransactionsRegistry {
  private readonly transactions = new Map<
    string,
    { transaction: Transaction; managers: Map<string, EntityManager> }
  >();

  registerTransactions(transactionId: string, transaction: Transaction) {
    this.transactions.set(transactionId, {
      transaction: transaction,
      managers: new Map(),
    });
  }

  registerManager(
    transactionId: string,
    name: string,
    manager: EntityManager,
  ): void {
    const managers = this.transactions.get(transactionId)!.managers;
    managers.set(name, manager);
  }

  remove(transactionId: string): void {
    this.transactions.delete(transactionId);
  }

  getTransaction(transactionId: string) {
    return this.transactions.get(transactionId)?.transaction;
  }

  hasTransaction(transactionId: string): boolean {
    return !!this.transactions.get(transactionId);
  }

  getManager(
    transactionId: string | undefined,
    name: string,
  ): EntityManager | undefined {
    return transactionId
      ? this.transactions.get(transactionId)?.managers.get(name)
      : undefined;
  }
}
