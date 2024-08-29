import 'reflect-metadata';
import 'whatwg-fetch';

import { configureTesting } from '@aspectjs/common/testing';
import { AspectError, getWeaver, WeaverModule } from '@aspectjs/core';
import nodeFetch from 'node-fetch';
import { HttpClientAspect } from '../aspects/http-client.aspect';
import { Mapper } from '../mapper.type';
import { HttpClient, Post } from '../public_api';
import { Body } from './body.annotation';

interface IHttpClientApi {
  method(...args: any[]): any;
}

describe('@Body() on a method parameter', () => {
  let fetchAdapter: typeof nodeFetch & jest.SpyInstance;
  let httpClientAspect: HttpClientAspect;
  let api: IHttpClientApi;
  let responseBodyMappers: Mapper[] = [];
  let requestBodyMappers: Mapper[] = [];
  beforeEach(() => {
    fetchAdapter = jest.fn((..._args: any[]) => {
      return Promise.resolve(undefined as any);
    });
    configureTesting(WeaverModule);
    responseBodyMappers = [];

    httpClientAspect = new HttpClientAspect({
      fetchAdapter,
      requestBodyMappers,
      responseBodyMappers,
    });
    getWeaver().enable(httpClientAspect);

    @HttpClient()
    class HttpClientApi implements IHttpClientApi {
      @Post('/test')
      method(@Body() body: string) {
        return body;
      }
    }

    api = new HttpClientApi();
  });

  describe('when the method is not annotated with a fetch annotation', () => {
    it('throws an error', () => {
      class HttpClientApi implements IHttpClientApi {
        method(@Body() arg?: string) {}
      }
      expect(() => new HttpClientApi().method()).toThrowError(
        new AspectError(
          httpClientAspect,
          `method HttpClientApi.method is missing a fetch annotation`,
        ),
      );
    });
  });

  it('calls the http adapter with the provided body', async () => {
    expect(fetchAdapter).not.toBeCalled();
    api.method('rest-body');

    expect(fetchAdapter).toBeCalledTimes(1);
    expect(fetchAdapter.mock.calls[0][1].body).toEqual('rest-body');
  });

  describe('when the aspect is given a mapper', () => {
    describe('that does not accept the given body', () => {
      beforeEach(() => {
        requestBodyMappers.push({
          accepts(obj) {
            return typeof obj === 'boolean';
          },
          map(body: boolean) {
            return false;
          },
        });
      });

      it('calls the http adapter with the mapped body', () => {
        expect(fetchAdapter).not.toBeCalled();
        api.method('rest-body');

        expect(fetchAdapter).toBeCalledTimes(1);
        expect(fetchAdapter.mock.calls[0][1].body).toEqual('rest-body');
      });
    });
    describe('that accepts the given body', () => {
      beforeEach(() => {
        requestBodyMappers.push({
          accepts(obj) {
            return typeof obj === 'string';
          },
          map(body: string) {
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
    });
  });
});
