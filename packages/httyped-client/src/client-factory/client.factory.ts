import { ConstructorType } from '@aspectjs/common/utils';
import { getWeaver } from '@aspectjs/core';
import { HttypedClientAspect } from '../aspects/httyped-client.aspect';
import { Mapper, MappersRegistry } from '../types/mapper.type';
import { RequestHandler } from '../types/request-handler.type';
import { ResponseHandler } from '../types/response-handler.type';
import { HttypedClientConfig } from './client-config.type';
import { MAP_JSON_RESPONSE_HANDLER } from './default-json-response-handler';
import { DefaultPathVariablesHandler } from './path-variables-handler.type';

const DEFAULT_CONFIG: Required<HttypedClientConfig> = {
  responseHandlers: [MAP_JSON_RESPONSE_HANDLER],
  requestHandlers: [],
  baseUrl: '',
  requestInit: {},
  fetchAdapter: fetch,
  requestBodyMappers: new MappersRegistry(),
  responseBodyMappers: new MappersRegistry(),
  pathVariablesHandler: new DefaultPathVariablesHandler(),
};

const configureAspect = () => {
  let clientAspect = getWeaver().getAspect(HttypedClientAspect);

  if (clientAspect) {
    return clientAspect;
  }
  clientAspect = new HttypedClientAspect();
  getWeaver().enable(clientAspect);
  return clientAspect;
};

export class HttypedClientFactory {
  protected readonly config: Required<HttypedClientConfig>;

  constructor(config?: HttypedClientConfig | HttypedClientFactory) {
    this.config =
      config instanceof HttypedClientFactory
        ? config.config
        : coerceConfig(config);
  }

  addResonseHandler(...handlers: ResponseHandler[]): HttypedClientFactory {
    this.config.responseHandlers = [
      ...this.config.responseHandlers,
      ...handlers,
    ];

    return this;
  }

  addRequestHandler(...handlers: RequestHandler[]): HttypedClientFactory {
    this.config.requestHandlers = [...this.config.requestHandlers, ...handlers];

    return this;
  }

  addRequestBodyMappers(...mappers: Mapper[]): HttypedClientFactory {
    this.config.requestBodyMappers = new MappersRegistry(
      this.config.requestBodyMappers,
    ).add(...mappers);
    return this;
  }

  addResponseBodyMappers(...mappers: Mapper[]): HttypedClientFactory {
    this.config.responseBodyMappers = new MappersRegistry(
      this.config.responseBodyMappers,
    ).add(...mappers);
    return this;
  }

  create<C extends ConstructorType>(
    httpClientClass: C,
    args?: ConstructorParameters<C>,
  ): InstanceType<C> {
    const client = Reflect.construct<ConstructorParameters<C>, InstanceType<C>>(
      httpClientClass as any,
      args ?? ([] as any),
    );

    return configureAspect().addClient(client, this.config);
  }
}

function coerceConfig(
  config?: Partial<HttypedClientConfig> | string,
): Required<HttypedClientConfig> {
  return typeof config === 'string'
    ? {
        ...DEFAULT_CONFIG,
        baseUrl: config,
      }
    : {
        ...DEFAULT_CONFIG,
        ...config,
      };
}
