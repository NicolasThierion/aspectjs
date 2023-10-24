import { configureTesting } from '@aspectjs/common/testing';
import { getWeaver } from '@aspectjs/core';
import { DataSource } from 'typeorm';
import { Db, initDb } from '../../src/test-helpers/init-db';
import { createDataSource } from '../../src/test-helpers/typeorm/init-ds';
import { Transactional } from '../../src/transactional/annotations/transactional.annotation';
import { TypeOrmTransactionManager } from './typeorm-transaction-manager';
import { TypeOrmTransactionalAspect } from './typeorm-transactional.aspect';

// disabled for now as we have not managed to run docker container in a gitlab runner
xdescribe('TypeOrmTransactionManager', () => {
  let ds: DataSource;
  let db: Db;
  let transactionManager: TypeOrmTransactionManager;
  beforeAll(async () => {
    db = await initDb();
  });

  beforeEach(async () => {
    ds = await createDataSource(db);
    configureTesting();
    transactionManager = new TypeOrmTransactionManager();
    getWeaver().enable(
      new TypeOrmTransactionalAspect(transactionManager).configure(ds),
    );
  });
  afterAll(async () => {
    db.teardown();
  });

  describe('.hasTransaction()', () => {
    describe('when called from a @Transactional method', () => {
      it('returns true', async () => {
        class T {
          @Transactional()
          m() {
            expect(transactionManager.hasTransaction()).toBe(true);
            return Promise.resolve();
          }
        }

        await new T().m();
      });
    });
    describe('when called from outside a @Transactional method', () => {
      it('returns false', () => {
        expect(transactionManager.hasTransaction()).toBe(false);
      });
    });
  });
});
