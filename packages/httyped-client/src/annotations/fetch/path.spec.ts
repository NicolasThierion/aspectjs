import 'reflect-metadata';
import 'whatwg-fetch';

import { configureTesting } from '@aspectjs/common/testing';
import { abstract } from '@aspectjs/common/utils';
import { AspectError, getWeaver, WeaverModule } from '@aspectjs/core';
import nodeFetch from 'node-fetch';
import { HttypedClientAspect } from '../../aspects/httyped-client.aspect';
import { HttypedClientConfig } from '../../client-factory/client-config.type';
import { HttypedClientFactory } from '../../client-factory/client.factory';
import { ALL_FETCH_ANNOTATIONS } from '../../test-helpers/all-fetch-annotations.helper';
import { HttypedClient } from '../http-client.annotation';

interface IHttpClientApi {
  method(): any;
}

const TEST_BASE_URL = 'http://testBaseUrl';

describe.each(ALL_FETCH_ANNOTATIONS)(
  '$annotationName(<path>) annotation on a method',
  ({ annotation, method }) => {
    let fetchAdapter: typeof nodeFetch & jest.SpyInstance;
    let httypedClientFactory: HttypedClientFactory;
    let httypedClientAspect: HttypedClientAspect;

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

    describe(`when the class is not annotated with @${HttypedClient.name}()`, () => {
      it('throws an error', () => {
        abstract class HttpClientApi implements IHttpClientApi {
          @annotation()
          async method(): Promise<object> {
            return abstract<object>();
          }
        }

        expect(() => httypedClientFactory.create(HttpClientApi)).toThrowError(
          new AspectError(
            httypedClientAspect,
            `class HttpClientApi is missing the @${HttypedClient.name} annotation`,
          ),
        );
      });
      describe('but parent class is', () => {
        it('uses the config from the parent class', () => {
          @HttypedClient({
            baseUrl: 'http://example.com',
          })
          abstract class HttpClientApiParent implements IHttpClientApi {
            method() {
              return abstract<object>();
            }
          }
          abstract class HttpClientApi extends HttpClientApiParent {
            @annotation()
            override method() {
              return abstract<object>();
            }
          }

          const api = httypedClientFactory.create(HttpClientApi);

          jest.fn().mock;
          expect(() => api.method()).not.toThrow();
          expect(fetchAdapter).toHaveBeenCalled();
          expect(fetchAdapter.mock.calls[0][0]).toEqual('http://example.com');
          expect(fetchAdapter.mock.calls[0][1].method).toEqual(method);
        });
      });
    });
    describe('when the class is annotated with @HttpClient({<baseUrl>})', () => {
      let api!: IHttpClientApi;

      beforeEach(() => (api = createHttpClientApi()));

      it('returns a promise', async () => {
        expect(api.method()).toEqual(expect.any(Promise));
      });

      describe('given no <path> argument', () => {
        it(`calls fetch("", { method: ${method}})`, async () => {
          await api.method();
          expect(fetchAdapter).toHaveBeenCalled();
          expect(fetchAdapter).toHaveBeenCalledWith(TEST_BASE_URL, {
            method,
          });
        });
      });

      describe('given a <path> argument', () => {
        beforeEach(() => (api = createHttpClientApi({}, 'path')));
        it(`calls fetch("<path>", { method: ${method}})`, async () => {
          await api.method();
          expect(fetchAdapter).toHaveBeenCalled();
          expect(fetchAdapter).toHaveBeenCalledWith(`${TEST_BASE_URL}/path`, {
            method,
          });
        });
      });
    });

    function createHttpClientApi(
      httpClientConfig?: Partial<HttypedClientConfig>,
      path?: string,
    ) {
      @HttypedClient({ ...httpClientConfig })
      abstract class HttpClientApi {
        @annotation(path)
        method() {
          return abstract<object>();
        }
      }

      return httypedClientFactory.create(HttpClientApi);
    }
  },
);
