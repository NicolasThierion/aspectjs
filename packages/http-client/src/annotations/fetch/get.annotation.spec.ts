import { configureTesting } from '@aspectjs/common/testing';
import { AspectError, getWeaver } from '@aspectjs/core';
import nodeFetch from 'node-fetch';
import 'reflect-metadata';
import 'whatwg-fetch';
import { HttpClientAspect } from '../../aspects/http-client.aspect';
import { HttpClientConfig } from '../../http-client-config.type';
import { HttpClient } from '../http-client.annotation';
import { Get } from './get.annotation';

interface IHttpClientApi {
  get(): any;
}

describe('@Get(<PARAMS>) annotation on a method', () => {
  let api!: IHttpClientApi;
  let httpBackend: typeof nodeFetch & jest.SpyInstance;

  beforeEach(() => {
    httpBackend = jest.fn((..._args: any[]) => {
      return Promise.resolve(undefined as any);
    });
    configureTesting();
    getWeaver().enable(
      new HttpClientAspect({
        httpBackend,
      }),
    );
    api = createHttpClientApi();
  });

  describe('when the class is not annotated with @HttpClient', () => {
    it('throws an error', () => {
      class HttpClientApi implements IHttpClientApi {
        @Get()
        get() {}
      }
      api = new HttpClientApi();

      expect(() => api.get()).toThrowError(
        new AspectError(
          `class HttpClientApi is missing the @HttpClient annotation`,
        ),
      );
    });
    describe('but parent is', () => {
      it('uses the config from the parent class', () => {
        @HttpClient({
          baseUrl: 'http://example.com',
        })
        class HttpClientApiParent implements IHttpClientApi {
          get() {}
        }
        class HttpClientApi extends HttpClientApiParent {
          @Get()
          override get() {}
        }

        api = new HttpClientApi();

        jest.fn().mock;
        expect(() => api.get()).not.toThrow();
        expect(httpBackend).toHaveBeenCalled();
        expect(httpBackend.mock.calls[0][0]).toEqual('http://example.com');
        expect(httpBackend.mock.calls[0][1].method).toEqual('get');
      });
    });
  });

  xdescribe('given no <CONFIG>', () => {
    it('should call fetch("", { method: "get"})', () => {
      api.get();
      expect(httpBackend).toHaveBeenCalled();
      expect(httpBackend).toHaveBeenCalledWith('/', { method: 'get' });
    });
  });

  xdescribe('given a path', () => {
    beforeEach(() => {
      api = createHttpClientApi({}, 'path');
    });
    it('should call fetch("path", { method: "get"})', () => {
      api.get();
      expect(httpBackend).toHaveBeenCalled();
      expect(httpBackend).toHaveBeenCalledWith('/path', { method: 'get' });
    });
  });

  function createHttpClientApi(
    httpClientConfig?: HttpClientConfig,
    path?: string,
  ) {
    @HttpClient({ ...httpClientConfig })
    class HttpClientApi {
      @Get(path)
      get() {}
    }

    return new HttpClientApi();
  }
});
