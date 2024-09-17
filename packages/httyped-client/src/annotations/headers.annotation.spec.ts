/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import 'reflect-metadata';
import 'whatwg-fetch';

import { configureTesting } from '@aspectjs/common/testing';
import { abstract } from '@aspectjs/common/utils';
import { WeaverModule, getWeaver } from '@aspectjs/core';
import { HttypedClientAspect } from '../aspects/httyped-client.aspect';
import { HttypedClientFactory } from '../client-factory/client.factory';
import { ALL_FETCH_ANNOTATIONS } from '../test-helpers/all-fetch-annotations.helper';
import { Headers } from './headers.annotation';
import { HttypedClient } from './http-client.annotation';

const TEST_BASE_URL = 'http://testbaseurl';

interface IApi {
  method(...args: any[]): Promise<any>;
}

describe.each(ALL_FETCH_ANNOTATIONS)(
  `${Headers}({<name>: <value>}) annotation`,
  ({ annotation, method }) => {
    let fetchAdapter: typeof fetch & jest.SpyInstance;
    let httypedClientFactory: HttypedClientFactory;
    let httypedClientAspect: HttypedClientAspect;
    let api: IApi;

    beforeEach(() => {
      fetchAdapter = jest.fn((..._args: any[]) => {
        return Promise.resolve(
          new Response('{ "val": "dummy response"}'),
        ) as any;
      });
      configureTesting(WeaverModule);
      httypedClientAspect = new HttypedClientAspect();
      getWeaver().enable(httypedClientAspect);

      httypedClientFactory = new HttypedClientFactory({
        fetchAdapter: fetchAdapter,
        baseUrl: TEST_BASE_URL,
      });
    });

    describe(`on a class annotated with ${HttypedClient}`, () => {
      beforeEach(() => {
        @HttypedClient()
        @Headers({ header1: 'value1', header2: 'value2' })
        abstract class Api implements IApi {
          @annotation()
          async method(args: any[]): Promise<any> {
            return abstract<unknown>();
          }
        }
        api = httypedClientFactory.create(Api);
      });

      describe(`calling a method annotated with ${method}`, () => {
        // it('everything is fine', async () => {});
        it('adds the given header to the request', async () => {
          await api.method();
          expect(fetchAdapter).toHaveBeenCalled();
          const request: Request = fetchAdapter.mock.calls[0][0];
          expect(request.headers.get('header1')).toEqual('value1');
          expect(request.headers.get('header2')).toEqual('value2');
        });

        describe(`when parent class is annotated with ${Headers}`, () => {
          it(`merges with the parent headers`, async () => {
            @HttypedClient()
            @Headers({ header1: 'parentValue1', parentHeader: 'parentValue' })
            abstract class ParentApi implements IApi {
              @annotation()
              async method(...args: any[]): Promise<any> {
                return abstract<unknown>();
              }
            }

            @HttypedClient()
            @Headers({ header1: 'value1', header2: 'value2' })
            abstract class Api extends ParentApi {
              @annotation()
              override async method(...args: any[]): Promise<any> {
                return abstract<unknown>();
              }
            }
            api = httypedClientFactory.create(Api);

            await api.method();
            expect(fetchAdapter).toHaveBeenCalled();
            const request: Request = fetchAdapter.mock.calls[0][0];
            expect(request.headers.get('parentHeader')).toEqual('parentValue');
            expect(request.headers.get('header1')).toEqual('value1');
            expect(request.headers.get('header2')).toEqual('value2');
          });
        });
      });
      describe(`on a method annotated with ${annotation}`, () => {
        beforeEach(() => {
          @HttypedClient()
          @Headers({ header1: 'classValue1', header2: 'classValue2' })
          abstract class Api implements IApi {
            @annotation()
            @Headers({ header2: 'methodValue2' })
            async method(...args: any[]): Promise<any> {
              return abstract<unknown>();
            }
          }
          api = httypedClientFactory.create(Api);
        });

        it('merges with the headers of the class', async () => {
          await api.method();
          expect(fetchAdapter).toHaveBeenCalled();
          const request: Request = fetchAdapter.mock.calls[0][0];
          expect(request.headers.get('header1')).toEqual('classValue1');
          expect(request.headers.get('header2')).toEqual('methodValue2');
        });
      });
      describe('on a property', () => {
        it('throws an error', () => {
          expect(() => {
            @HttypedClient()
            abstract class Api implements IApi {
              @Headers({ header2: 'methodValue2' })
              prop!: string;
              async method(...args: any[]): Promise<any> {}
            }

            httypedClientFactory.create(Api).prop;
          }).toThrow(
            `[ajs.httyped-client]: Annotations are not allowed: ${Headers.ref} on property Api.prop`,
          );
        });
      });
      describe('on a parameter', () => {
        it('throws an error', () => {
          expect(() => {
            @HttypedClient()
            abstract class Api implements IApi {
              async method(
                @Headers({ header2: 'methodValue2' })
                x: string,
              ): Promise<any> {}
            }
            httypedClientFactory.create(Api).method('');
          }).toThrow(
            `[ajs.httyped-client]: Annotations are not allowed: ${Headers.ref} on argument Api.method[0]`,
          );
        });
      });
    });
  },
);
