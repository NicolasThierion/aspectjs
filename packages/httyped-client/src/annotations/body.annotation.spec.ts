import nodeFetch from 'node-fetch';
import 'reflect-metadata';
import 'whatwg-fetch';

import { configureTesting } from '@aspectjs/common/testing';
import { abstract } from '@aspectjs/common/utils';
import { AspectError, getWeaver, WeaverModule } from '@aspectjs/core';
import { HttypedClientFactory } from '../client-factory/client.factory';
import { Mapper, MapperContext } from '../mapper.type';
import { HttypedClientAspect } from '../public_api';
import { Body } from './body.annotation';
import { Post } from './fetch/post.annotation';
import { HttypedClient } from './http-client.annotation';

interface IHttpClientApi {
  method(...args: any[]): any;
}

describe('@Body() on a method parameter', () => {
  let fetchAdapter: typeof nodeFetch & jest.SpyInstance;
  let httypedClientFactory: HttypedClientFactory;
  let api: IHttpClientApi;
  let responseBodyMappers: Mapper[] = [];
  let requestBodyMappers: Mapper[] = [];
  let httypedClientAspect: HttypedClientAspect;
  beforeEach(() => {
    fetchAdapter = jest.fn((..._args: any[]) => {
      return Promise.resolve(undefined as any);
    });
    configureTesting(WeaverModule);
    responseBodyMappers = [];

    httypedClientFactory = new HttypedClientFactory({
      fetchAdapter,
      requestBodyMappers,
      responseBodyMappers,
    });

    @HttypedClient()
    abstract class HttpClientApi implements IHttpClientApi {
      @Post('/test')
      async method(@Body() body: string) {
        return abstract<object>();
      }
    }

    api = httypedClientFactory.create(HttpClientApi);
    httypedClientAspect = getWeaver().getAspects(HttypedClientAspect)[0]!;
  });

  describe('when the method is not annotated with a fetch annotation', () => {
    it('throws an error', () => {
      @HttypedClient()
      abstract class HttpClientApi implements IHttpClientApi {
        method(@Body() arg?: string) {
          return abstract();
        }
      }
      expect(() =>
        httypedClientFactory.create(HttpClientApi).method(),
      ).toThrowError(
        new AspectError(
          httypedClientAspect,
          `method HttpClientApi.method is missing a fetch annotation`,
        ),
      );
    });
  });

  it('calls the http adapter with the provided body', () => {
    expect(fetchAdapter).not.toBeCalled();
    api.method('rest-body');

    expect(fetchAdapter).toBeCalledTimes(1);
    expect(fetchAdapter.mock.calls[0][1].body).toEqual('rest-body');
  });

  describe('when the aspect is given a mapper', () => {
    describe('that does not accept the given body', () => {
      beforeEach(() => {
        requestBodyMappers.push({
          accepts(obj, mapperContext) {
            return typeof obj === 'boolean';
          },
          map(body, mapperContext) {
            return false;
          },
        });
      });

      it('calls the http adapter with original body', () => {
        expect(fetchAdapter).not.toBeCalled();
        api.method('rest-body');

        expect(fetchAdapter).toBeCalledTimes(1);
        expect(fetchAdapter.mock.calls[0][1].body).toEqual('rest-body');
      });
    });
    describe('that accepts the given body', () => {
      const map = jest.fn();

      beforeEach(() => {
        jest.resetAllMocks();

        requestBodyMappers.push({
          accepts(obj, mapperContext) {
            return typeof obj === 'string';
          },
          map(body: string, mapperContext) {
            map(body, mapperContext);
            return body.toUpperCase();
          },
        });
      });

      it('calls the http adapter with the mapped body', () => {
        expect(fetchAdapter).not.toBeCalled();
        api.method('rest-body');

        expect(fetchAdapter).toBeCalledTimes(1);
        expect(fetchAdapter.mock.calls[0][1].body).toEqual('REST-BODY');
      });

      it('calls the mapper with proper type hint', () => {
        api.method('rest-body');
        expect(map).toBeCalledWith('rest-body', {
          typeHint: String,
        } satisfies MapperContext);
      });
    });
  });
});
