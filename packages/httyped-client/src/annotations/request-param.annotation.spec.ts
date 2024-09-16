import 'reflect-metadata';
import 'whatwg-fetch';

import { configureTesting } from '@aspectjs/common/testing';
import { getWeaver, WeaverModule } from '@aspectjs/core';
import { HttypedClientAspect } from '../aspects/httyped-client.aspect';
import { HttypedClientFactory } from '../client-factory/client.factory';
import { ALL_FETCH_ANNOTATIONS } from '../test-helpers/all-fetch-annotations.helper';
import { HttypedClient } from './http-client.annotation';
import { RequestParam } from './request-param.annotation';

interface IHttpClientApi {
  method(...args: any[]): any;
}

const TEST_BASE_URL = 'http://testbaseurl:8080';

describe.each(ALL_FETCH_ANNOTATIONS)(
  `${RequestParam}() argument of method annotated with $annotationName()`,
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

    describe(`calling a method with a single ${RequestParam}("param")`, () => {
      beforeEach(() => {
        @HttypedClient()
        class HttpClientApi {
          @annotation()
          method(@RequestParam('param') var1: string) {}
        }

        api = httypedClientFactory.create(HttpClientApi);
      });
      it('appends query string "?param=value" to the request', async () => {
        await api.method('value');
        expect(fetchAdapter).toHaveBeenCalled();
        const url = new URL(fetchAdapter.mock.calls[0][0].url);
        const { searchParams } = url;
        expect(`${searchParams}`).toEqual(`param=value`);
      });
    });

    describe(`calling a method with several different ${RequestParam}("param1") & ${RequestParam}("param2") annotations`, () => {
      beforeEach(() => {
        @HttypedClient()
        class HttpClientApi {
          @annotation()
          method(
            @RequestParam('param1') var1: string,
            @RequestParam('param2') var2: string,
          ) {}
        }

        api = httypedClientFactory.create(HttpClientApi);
      });
      it('appends query string "?param1=value1&?param2=value2" to the request', async () => {
        await api.method('value1', 'value2');

        expect(fetchAdapter).toHaveBeenCalled();
        const url = new URL(fetchAdapter.mock.calls[0][0].url);
        const { searchParams } = url;
        expect(`${searchParams}`).toEqual(`param1=value1&param2=value2`);
      });
    });

    describe(`calling a method with two arguments annotated with the same ${RequestParam}("param")`, () => {
      beforeEach(() => {
        @HttypedClient()
        class HttpClientApi {
          @annotation()
          method(
            @RequestParam('param') var1: string,
            @RequestParam('param') var2: string,
          ) {}
        }

        api = httypedClientFactory.create(HttpClientApi);
      });
      it('appends query string "?param1=value1&?param1=value1" to the request', async () => {
        await api.method('value1', 'value2');

        expect(fetchAdapter).toHaveBeenCalled();
        const url = new URL(fetchAdapter.mock.calls[0][0].url);
        const { searchParams } = url;
        expect(`${searchParams}`).toEqual(`param=value1&param=value2`);
      });
    });
  },
);
