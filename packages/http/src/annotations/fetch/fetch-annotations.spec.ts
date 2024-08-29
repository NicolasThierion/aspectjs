import 'reflect-metadata';
import 'whatwg-fetch';

import { configureTesting } from '@aspectjs/common/testing';
import { AspectError, WeaverModule, getWeaver } from '@aspectjs/core';
import nodeFetch from 'node-fetch';
import { HttpClientAspect } from '../../aspects/http-client.aspect';
import { HttpClientConfig } from '../../http-client-config.type';
import { HttpClient } from '../http-client.annotation';
import { Delete } from './delete.annotation';
import { Get } from './get.annotation';
import { Head } from './head.annotation';
import { Option } from './option.annotation';
import { Patch } from './patch.annotation';
import { Post } from './post.annotation';
import { Put } from './put.annotation';

interface IHttpClientApi {
  method(): any;
}

const ASPECT_BASE_URL = 'protocol://aspectBaseUrl';

describe.each([
  {
    annotation: Get,
    annotationName: `${Get}`,
    method: 'get',
  },
  {
    annotation: Post,
    annotationName: `${Post}`,
    method: 'post',
  },
  {
    annotation: Put,
    annotationName: `${Put}`,
    method: 'put',
  },
  {
    annotation: Delete,
    annotationName: `${Delete}`,
    method: 'delete',
  },
  {
    annotation: Patch,
    annotationName: `${Patch}`,
    method: 'patch',
  },
  {
    annotation: Option,
    annotationName: `${Option}`,
    method: 'option',
  },
  {
    annotation: Head,
    annotationName: `${Head}`,
    method: 'head',
  },
])(
  '$annotationName(<path>) annotation on a method',
  ({ annotation, method }) => {
    let httpBackend: typeof nodeFetch & jest.SpyInstance;
    let httpClientAspect: HttpClientAspect;
    beforeEach(() => {
      httpBackend = jest.fn((..._args: any[]) => {
        return Promise.resolve(undefined as any);
      });
      configureTesting(WeaverModule);
      httpClientAspect = new HttpClientAspect({
        fetchAdapter: httpBackend,
        baseUrl: ASPECT_BASE_URL,
      });
      getWeaver().enable(httpClientAspect);
    });

    describe('when the class is not annotated with @HttpClient()', () => {
      it('throws an error', () => {
        class HttpClientApi implements IHttpClientApi {
          @annotation()
          method() {}
        }

        const api = new HttpClientApi();
        expect(() => api.method()).toThrowError(
          new AspectError(
            httpClientAspect,
            `class HttpClientApi is missing the @HttpClient annotation`,
          ),
        );
      });
      describe('but parent class is', () => {
        it('uses the config from the parent class', () => {
          @HttpClient({
            baseUrl: 'http://example.com',
          })
          class HttpClientApiParent implements IHttpClientApi {
            method() {}
          }
          class HttpClientApi extends HttpClientApiParent {
            @annotation()
            override method() {}
          }

          const api = new HttpClientApi();

          jest.fn().mock;
          expect(() => api.method()).not.toThrow();
          expect(httpBackend).toHaveBeenCalled();
          expect(httpBackend.mock.calls[0][0]).toEqual('http://example.com');
          expect(httpBackend.mock.calls[0][1].method).toEqual(method);
        });
      });
    });
    describe('when the class is annotated with @HttpClient({<baseUrl>})', () => {
      let api!: IHttpClientApi;

      beforeEach(() => (api = createHttpClientApi()));

      it('returns a promise', () => {
        expect(api.method()).toEqual(expect.any(Promise));
      });

      describe('given no <path> argument', () => {
        it('calls fetch("", { method: "get"})', () => {
          api.method();
          expect(httpBackend).toHaveBeenCalled();
          expect(httpBackend).toHaveBeenCalledWith(ASPECT_BASE_URL, {
            method,
          });
        });
      });

      describe('given a <path> argument', () => {
        beforeEach(() => (api = createHttpClientApi({}, 'path')));
        it('calls fetch("<path>", { method: "get"})', () => {
          api.method();
          expect(httpBackend).toHaveBeenCalled();
          expect(httpBackend).toHaveBeenCalledWith(`${ASPECT_BASE_URL}/path`, {
            method,
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
        @annotation(path)
        method() {}
      }

      return new HttpClientApi();
    }
  },
);
