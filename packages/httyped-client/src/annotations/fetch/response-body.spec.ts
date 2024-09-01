import 'reflect-metadata';
import 'whatwg-fetch';

import { configureTesting } from '@aspectjs/common/testing';
import { getWeaver, WeaverModule } from '@aspectjs/core';
import nodeFetch from 'node-fetch';
import { HttypedClientAspect } from '../../aspects/httyped-client.aspect';
import { HttypedClientFactory } from '../../client-factory/client.factory';
import { ALL_FETCH_ANNOTATIONS } from '../../test-helpers/all-fetch-annotations.helper';

const TEST_BASE_URL = 'http://testBaseUrl';

describe.each(ALL_FETCH_ANNOTATIONS)(
  'return value of a method annotated with $annotationName(<path>)',
  ({ annotation, method }) => {
    let fetchAdapter: typeof nodeFetch & jest.SpyInstance;
    let httypedClientFactory: HttypedClientFactory;
    let httypedClientAspect: HttypedClientAspect;

    beforeEach(() => {
      fetchAdapter = jest.fn((..._args: any[]) => {
        return Promise.resolve(undefined as any);
      });
      configureTesting(WeaverModule);
      httypedClientAspect = new HttypedClientAspect();
      getWeaver().enable(httypedClientAspect);
      httypedClientFactory = new HttypedClientFactory({
        fetchAdapter: fetchAdapter,
        baseUrl: TEST_BASE_URL,
      });
    });
  },
);
