import { configureTesting } from '@aspectjs/common/testing';
import { getWeaver } from '@aspectjs/core';
import { DataSource, EntityManager } from 'typeorm';
import { TypeOrmTransactionalAspect } from '../../typeorm/src/typeorm-transactional.aspect';
import { Db, initDb } from '../test-helpers/init-db';
import { createDataSource } from '../test-helpers/typeorm/init-ds';
import { Post } from '../test-helpers/typeorm/post.entity';
import { User } from '../test-helpers/typeorm/user.entity';
import { Transactional } from './annotations/transactional.annotation';

interface PostService {
  call(...args: any): any;
}
interface UserService {
  call(...args: any): any;
}

// disabled for now as we have not managed to run docker container in a gitlab runner
xdescribe('TypeOrmTransactionalAspect with @Transactional() annotation', () => {
  let postService: PostService;
  let userService: UserService;

  let ds: DataSource;
  let db: Db;
  let em: EntityManager;
  let typeOrmTransactionalAspect!: TypeOrmTransactionalAspect;

  beforeAll(async () => {
    db = await initDb();
  });

  beforeEach(async () => {
    ds = await createDataSource(db);
    configureTesting();
    typeOrmTransactionalAspect = new TypeOrmTransactionalAspect().configure(ds);
    getWeaver().enable(typeOrmTransactionalAspect);
    em = ds.manager;
  });

  afterAll(async () => {
    db?.teardown();
  });

  describe('on methods', () => {
    function createServices(
      userImpl?: (...args: any[]) => any,
      postImpl?: (...args: any[]) => any,
    ) {
      class PostServiceImpl implements PostService {
        constructor() {}
        @Transactional()
        call(...args: any) {
          return postImpl?.(...args);
        }
      }

      class UserServiceImpl implements UserService {
        @Transactional()
        call(...args: any) {
          return userImpl?.(...args);
        }
      }

      userService = new UserServiceImpl();
      postService = new PostServiceImpl();
    }

    describe('when the method is called', () => {
      beforeEach(() =>
        createServices(
          async () => {
            await em.save(new User());
            await postService.call();
          },
          () => em.save(new Post()),
        ),
      );

      it('replaces the entityManager with a transactional entityManager', () => {
        createServices(
          async () => {
            expect(
              typeOrmTransactionalAspect.transactionManager.hasTransaction(),
            ).toBe(true);
          },
          () => {},
        );
      });

      it('commits the entries together', async () => {
        let usersCount = await em.count(User);
        let postsCount = await em.count(Post);

        expect(usersCount).toEqual(0);
        expect(postsCount).toEqual(0);
        await userService.call();
        usersCount = await em.count(User);
        postsCount = await em.count(Post);

        expect(usersCount).toEqual(1);
        expect(postsCount).toEqual(1);
      });

      describe('and the method fails', () => {
        beforeEach(() =>
          createServices(
            async () => {
              await em.save(new User());
              await postService.call();
              await em.save(new User()); // create the post user twice;
            },
            () => {
              return em.save(new Post());
            },
          ),
        );

        it(
          'rollbacks the entries together',
          async () => {
            const userCount = await em.count(User);
            const postCount = await em.count(Post);
            expect(userCount).toEqual(0);
            expect(postCount).toEqual(0);
            let error: Error | undefined;
            try {
              await userService.call();
            } catch (e) {
              error = e as Error;
            }
            expect(error).toBeInstanceOf(Error);
            expect(await em.count(User)).toEqual(0);
            expect(await em.count(Post)).toEqual(0);
          },
          60 * 1000 * 10,
        );
      });
    });
  });
});
