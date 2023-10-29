import { configureTesting } from '@aspectjs/common/testing';
import { AspectError, WeaverModule, getWeaver } from '@aspectjs/core';
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

describe('@Get() annotation on a method', () => {
  let httpBackend: typeof nodeFetch & jest.SpyInstance;
  let httpClientAspect: HttpClientAspect;
  beforeEach(() => {
    httpBackend = jest.fn((..._args: any[]) => {
      return Promise.resolve(undefined as any);
    });
    configureTesting(WeaverModule);
    httpClientAspect = new HttpClientAspect({
      httpBackend,
    });
    getWeaver().enable(httpClientAspect);
  });

  describe('when the class is not annotated with @HttpClient()', () => {
    it('throws an error', () => {
      class HttpClientApi implements IHttpClientApi {
        @Get()
        get() {}
      }

      const api = new HttpClientApi();
      expect(() => api.get()).toThrowError(
        new AspectError(
          httpClientAspect,
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

        const api = new HttpClientApi();

        jest.fn().mock;
        expect(() => api.get()).not.toThrow();
        expect(httpBackend).toHaveBeenCalled();
        expect(httpBackend.mock.calls[0][0]).toEqual('http://example.com');
        expect(httpBackend.mock.calls[0][1].method).toEqual('get');
      });
    });
  });
  describe('when the class is annotated with @HttpClient({baseUrl})', () => {
    let api!: IHttpClientApi;

    beforeEach(() => {
      api = createHttpClientApi();
    });
    describe('given no path', () => {
      it('should call fetch("", { method: "get"})', () => {
        api.get();
        expect(httpBackend).toHaveBeenCalled();
        expect(httpBackend).toHaveBeenCalledWith('', { method: 'get' });
      });
    });

    describe('given argument path to @Get({path})', () => {
      beforeEach(() => {
        api = createHttpClientApi({}, 'path');
      });
      it('should call fetch("path", { method: "get"})', () => {
        api.get();
        expect(httpBackend).toHaveBeenCalled();
        expect(httpBackend).toHaveBeenCalledWith('path', { method: 'get' });
      });

      describe('and given argument path baseUrl @HttpClient({baseUrl})', () => {
        beforeEach(() => {
          api = createHttpClientApi(
            {
              baseUrl: 'baseUrl',
            },
            'path',
          );
        });
        it('should call fetch("baseUrl/path", { method: "get"})', () => {
          api.get();
          expect(httpBackend).toHaveBeenCalled();
          expect(httpBackend).toHaveBeenCalledWith('baseUrl/path', {
            method: 'get',
          });
        });
      });
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
