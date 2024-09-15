import 'reflect-metadata';
import 'whatwg-fetch';

import { configureTesting } from '@aspectjs/common/testing';
import { abstract } from '@aspectjs/common/utils';
import { getWeaver, WeaverModule } from '@aspectjs/core';
import nodeFetch from 'node-fetch';
import { HttypedClientAspect } from '../../aspects/httyped-client.aspect';
import { HttypedClientFactory } from '../../client-factory/client.factory';
import { ALL_FETCH_ANNOTATIONS } from '../../test-helpers/all-fetch-annotations.helper';
import { MapperError } from '../../types/mapper.error';
import { Mapper } from '../../types/mapper.type';
import { HttypedClient } from '../http-client.annotation';
import { TypeHint } from '../type.annotation';

const TEST_BASE_URL = 'http://testbaseurl';

interface IApi {
  method(): Promise<any>;
}
const USER: User = {
  type: 'user',
  name: 'Joe',
  lastName: 'Dalton',
};

class User {
  type: 'user' = 'user';
  name!: string;
  lastName!: string;
}

describe.each(ALL_FETCH_ANNOTATIONS)(
  'Given a method annotated with $annotationName(<path>) that returns a value',
  ({ annotation, method }) => {
    let fetchAdapter: typeof nodeFetch & jest.SpyInstance;
    let httypedClientFactory: HttypedClientFactory;
    let httypedClientAspect: HttypedClientAspect;
    let api: IApi;

    let mapper1 = {
      typeHint: 'Undefined' as Mapper['typeHint'],
      map: jest.fn(),
    } satisfies Mapper;

    let mapper2 = {
      typeHint: 'Undefined' as Mapper['typeHint'],
      map: jest.fn(),
    } satisfies Mapper;

    beforeEach(() => {
      fetchAdapter = jest.fn((..._args: any[]) => {
        return Promise.resolve(new Response(JSON.stringify(USER))) as any;
      });
      configureTesting(WeaverModule);
      httypedClientAspect = new HttypedClientAspect();
      getWeaver().enable(httypedClientAspect);

      httypedClientFactory = new HttypedClientFactory({
        fetchAdapter: (...args: any[]) => (fetchAdapter as any)(...args),
        baseUrl: TEST_BASE_URL,
      });

      mapper1 = {
        typeHint: 'Undefined',
        map: jest.fn(),
      } satisfies Mapper;

      mapper2 = {
        typeHint: 'Undefined',
        map: jest.fn(),
      } satisfies Mapper;
    });

    describe('when no mappers matches', () => {
      beforeEach(() => {
        @HttypedClient()
        abstract class Api implements IApi {
          @annotation()
          async method() {
            return abstract(new User());
          }
        }
        api = httypedClientFactory.create(Api);
        httypedClientFactory.addResponseBodyMappers(mapper1);
      });
      it('returns a JSON object as is', async () => {
        expect(await api.method()).toEqual(USER);
      });

      it('does not invoke the mappers', async () => {
        await api.method();
        expect(mapper1.map).not.toHaveBeenCalled();
      });
    });

    describe(`when the method returns a templated ${abstract.name}(<T>)`, () => {
      beforeEach(() => {
        @HttypedClient()
        abstract class Api implements IApi {
          @annotation()
          async method() {
            return abstract(new User());
          }
        }
        api = httypedClientFactory.create(Api);
      });
      describe('and a mapper has been registered for this type constructor', () => {
        beforeEach(() => {
          mapper2.typeHint = [User, 'Void'];
          mapper2.map = jest.fn((obj) => obj);

          httypedClientFactory.addResponseBodyMappers(mapper1, mapper2);
        });
        it('calls the mapper that matches the typeHint', async () => {
          await api.method();

          expect(mapper1.map).not.toHaveBeenCalled();
          expect(mapper2.map).toHaveBeenCalled();
          const args = mapper2.map.mock.calls[0]!;
          expect(args[0]).toEqual(USER);
        });
      });

      describe('and a mapper has been registered for this type name', () => {
        beforeEach(() => {
          mapper2.typeHint = ['User', 'Void'];
          mapper2.map = jest.fn((obj) => obj);

          httypedClientFactory.addResponseBodyMappers(mapper1, mapper2);
        });
        it('calls the mapper that matches the typeHint', async () => {
          await api.method();

          expect(mapper1.map).not.toHaveBeenCalled();
          expect(mapper2.map).toHaveBeenCalled();
          const args = mapper2.map.mock.calls[0]!;
          expect(args[0]).toEqual(USER);
        });
      });
      describe('and a mapper has been registered for a parent constructor', () => {
        beforeEach(() => {
          mapper2.typeHint = [User, 'Void'];
          mapper2.map = jest.fn((obj) => obj);

          httypedClientFactory.addResponseBodyMappers(mapper1, mapper2);

          class Customer extends User {}
          @HttypedClient()
          abstract class Api implements IApi {
            @annotation()
            async method() {
              return abstract(new Customer());
            }
          }
          api = httypedClientFactory.create(Api);
        });

        it('calls the mapper that matches the parent type', async () => {
          await api.method();

          expect(mapper1.map).not.toHaveBeenCalled();
          expect(mapper2.map).toHaveBeenCalled();
          const args = mapper2.map.mock.calls[0]!;
          expect(args[0]).toEqual(USER);
        });
      });

      describe('and the returned abstract is an array template', () => {
        beforeEach(() => {
          mapper2.typeHint = [User, 'Void'];
          mapper2.map = jest.fn((obj) =>
            Object.setPrototypeOf({ ...obj }, User.prototype),
          );

          httypedClientFactory.addResponseBodyMappers(mapper1, mapper2);

          @HttypedClient()
          abstract class Api implements IApi {
            @annotation()
            async method() {
              return abstract([new User(), { street: 'street' }, new User()]);
            }
          }
          api = httypedClientFactory.create(Api);
        });
        describe('But the http call does not return an array', () => {
          it('throws an error', async () => {
            try {
              await api.method();
              throw new Error('method call should have thrown an error');
            } catch (e) {
              expect(e).toEqual(expect.any(MapperError));
              expect((e as Error).message).toEqual(
                'Mapper expected an array, but got Object',
              );
            }
          });
        });
        it('returns an array of values, calling the corresponding mappers', async () => {
          fetchAdapter = jest.fn((..._args: any[]) => {
            return Promise.resolve(
              new Response(JSON.stringify([USER, { street: 'street' }, USER])),
            ) as any;
          });

          const res = await api.method();

          expect(mapper1.map).not.toHaveBeenCalled();
          expect(mapper2.map).toHaveBeenCalledTimes(2);
          const args = mapper2.map.mock.calls[0]!;
          expect(args[0]).toEqual(USER);
          expect(res[0]).toEqual(expect.any(User));
          expect(res[1]).not.toEqual(expect.any(User));
          expect(res[2]).toEqual(expect.any(User));
        });
      });
    });
    describe(`and the method has a ${TypeHint}(<T>) annotation`, () => {
      describe(`that specifies the type as a constructor`, () => {
        beforeEach(() => {
          mapper2.typeHint = User;
          mapper2.map = jest.fn((obj) =>
            Object.setPrototypeOf({ ...obj }, User.prototype),
          );

          @HttypedClient()
          abstract class Api implements IApi {
            @annotation()
            @TypeHint(User)
            async method() {
              return abstract<User>();
            }
          }
          api = httypedClientFactory.create(Api);
          httypedClientFactory.addResponseBodyMappers(mapper1, mapper2);
        });
        it(`calls the mapper that matches the typeHint`, async () => {
          const res = await api.method();

          expect(mapper2.map).toHaveBeenCalled();
          const args = mapper2.map.mock.calls[0]!;
          expect(args[0]).toEqual(USER);
          expect(res).toEqual(expect.any(User));
        });
      });

      describe(`that specifies the type as a type name`, () => {
        beforeEach(() => {
          mapper2.typeHint = User;
          mapper2.map = jest.fn((obj) =>
            Object.setPrototypeOf({ ...obj }, User.prototype),
          );

          @HttypedClient()
          abstract class Api implements IApi {
            @annotation()
            @TypeHint('User')
            async method() {
              return abstract<User>();
            }
          }
          api = httypedClientFactory.create(Api);
          httypedClientFactory.addResponseBodyMappers(mapper1, mapper2);
        });
        it(`calls the mapper that matches the typeHint`, async () => {
          const res = await api.method();

          expect(mapper2.map).toHaveBeenCalled();
          const args = mapper2.map.mock.calls[0]!;
          expect(args[0]).toEqual(USER);

          expect(res).toEqual(expect.any(User));
        });
      });
    });

    describe('when several mappers match', () => {
      beforeEach(() => {
        mapper1.typeHint = User;
        mapper2.typeHint = User;

        @HttypedClient()
        abstract class Api implements IApi {
          @annotation()
          @TypeHint(User)
          async method() {
            return abstract<User>();
          }
        }
        api = httypedClientFactory.create(Api);
        httypedClientFactory.addResponseBodyMappers(mapper1, mapper2);
      });

      it('calls the last mapper that matches', async () => {
        await api.method();

        expect(mapper2.map).toHaveBeenCalled();
      });

      it('calls only the last mapper that matches', async () => {
        await api.method();

        expect(mapper1.map).not.toHaveBeenCalled();
      });
    });
  },
);
