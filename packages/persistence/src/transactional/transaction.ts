export interface Transaction {
  rollback(): Promise<void>;
  commit(): Promise<void>;
  close(): Promise<void>;
  run<T = void>(fn: (transaction: Transaction) => Promise<T> | T): Promise<T>;
}
