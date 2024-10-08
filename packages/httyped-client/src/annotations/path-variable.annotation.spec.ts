/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import 'reflect-metadata';
import 'whatwg-fetch';

import { configureTesting } from '@aspectjs/common/testing';
import { getWeaver, WeaverModule } from '@aspectjs/core';
import { HttypedClientAspect } from '../aspects/httyped-client.aspect';
import { HttypedClientFactory } from '../client-factory/client.factory';
import { ALL_FETCH_ANNOTATIONS } from '../test-helpers/all-fetch-annotations.helper';
import { HttypedClient } from './http-client.annotation';
import { PathVariable } from './path-variable.annotation';

interface IHttpClientApi {
  method(...args: any[]): any;
}

const TEST_BASE_URL = 'http://testbaseurl:8080';

describe.each(ALL_FETCH_ANNOTATIONS)(
  '$annotationName(path/:pathVariable) annotation on a method',
  ({ annotation, method }) => {
    let fetchAdapter: typeof fetch & jest.SpyInstance;
    let httypedClientFactory: HttypedClientFactory;
    let httypedClientAspect: HttypedClientAspect;
    let api: IHttpClientApi;
    beforeEach(() => {
      fetchAdapter = jest.fn((..._args: any[]) => {
        return Promise.resolve(new Response('{}') as any);
      });
      configureTesting(WeaverModule);
      httypedClientAspect = new HttypedClientAspect();
      getWeaver().enable(httypedClientAspect);
      httypedClientFactory = new HttypedClientFactory({
        baseUrl: TEST_BASE_URL,
        fetchAdapter: fetchAdapter,
      });
    });

    describe(`when the method lacks an argument annotated with ${PathVariable}`, () => {
      beforeEach(() => {
        @HttypedClient()
        class HttpClientApi {
          @annotation('/:variable')
          method() {}
        }

        api = httypedClientFactory.create(HttpClientApi);
      });
      it('throws an error', async () => {
        expect(() => api.method()).toThrowError(
          `${PathVariable}(:variable) parameter is missing for method HttpClientApi.method`,
        );
      });
    });

    describe(`when the has an unmatched argument annotated with ${PathVariable}`, () => {
      beforeEach(() => {
        @HttypedClient()
        class HttpClientApi {
          @annotation('/:variable')
          method(
            @PathVariable('variable') var1: string,
            @PathVariable('unmatched') var2: string,
          ) {}
        }

        api = httypedClientFactory.create(HttpClientApi);
      });
      it('throws an error', async () => {
        expect(() => api.method('a', 'b')).toThrowError(
          `[ajs.httyped-client]: ${PathVariable}(:unmatched) parameter of method HttpClientApi.method does not match url ${TEST_BASE_URL}/:variable`,
        );
      });
    });

    describe(`when the method has the same ${PathVariable} more than once`, () => {
      beforeEach(() => {
        @HttypedClient()
        class HttpClientApi {
          @annotation('/:variable')
          method(
            @PathVariable('variable') var1: string,
            @PathVariable('variable') var2: string,
          ) {}
        }

        api = httypedClientFactory.create(HttpClientApi);
      });
      it('throws an error', async () => {
        expect(() => api.method('a', 'b')).toThrowError(
          `[ajs.httyped-client]: ${PathVariable}(variable) is specified twice for method HttpClientApi.method`,
        );
      });
    });

    describe(`when the method has an argument annotated with ${PathVariable}`, () => {
      beforeEach(() => {
        @HttypedClient()
        class HttpClientApi {
          @annotation('/:variable/:variable2')
          method(
            @PathVariable('variable') variable: string,
            @PathVariable('variable2') variable2: string,
          ) {}
        }

        api = httypedClientFactory.create(HttpClientApi);
      });

      it(`calls fetch("<path>", { method: ${method}})`, async () => {
        await api.method('a', 'b');
        expect(fetchAdapter).toHaveBeenCalled();
        const request: Request = fetchAdapter.mock.calls[0][0];
        expect(request.url).toEqual(`${TEST_BASE_URL}/a/b/`);
        expect(request.method.toLocaleLowerCase()).toEqual(
          method.toLocaleLowerCase(),
        );
      });
    });
  },
);
