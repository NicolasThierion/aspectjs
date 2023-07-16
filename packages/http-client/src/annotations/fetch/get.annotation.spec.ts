import { configureTesting } from '@aspectjs/common/testing';
import { getWeaver } from '@aspectjs/core';
import nodeFetch from 'node-fetch';
import 'whatwg-fetch';
import { HttpClientAspect } from '../../aspects/http-client.aspect';
import { HttpClientConfig } from '../../http-client-config.type';
import { HttpClient } from '../http-client.annotation';
import { Get } from './get.annotation';

interface IHttpClientApi {
  get(): any;
}

describe('calling a method annotated with @Get(<PATH>)', () => {
  let api!: IHttpClientApi;
  let fetchAdapter: typeof nodeFetch;
  beforeEach(() => {
    configureTesting();
    getWeaver().enable(new HttpClientAspect());
    fetchAdapter = jest.fn((..._args: any[]) => {
      return Promise.resolve(undefined as any);
    });
  });

  describe('given no <CONFIG>', () => {
    beforeEach(() => {
      api = createHttpClientApi();
    });
    it('should call fetch("", { method: "get"})', () => {
      api.get();
      expect(fetchAdapter).toHaveBeenCalled();
      expect(fetchAdapter).toHaveBeenCalledWith('/', { method: 'get' });
    });
  });

  describe('given a path', () => {
    beforeEach(() => {
      api = createHttpClientApi({}, 'path');
    });
    it('should call fetch("path", { method: "get"})', () => {
      api.get();
      expect(fetchAdapter).toHaveBeenCalled();
      expect(fetchAdapter).toHaveBeenCalledWith('/path', { method: 'get' });
    });
  });

  function createHttpClientApi(
    httpClientConfig?: HttpClientConfig,
    path?: string,
  ) {
    @HttpClient({ httpBackend: fetchAdapter, ...httpClientConfig })
    class HttpClientApi {
      @Get(path)
      get() {}
    }

    return new HttpClientApi();
  }
});
