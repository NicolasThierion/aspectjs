import { ConstructorType } from '@aspectjs/common/utils';
import { getWeaver } from '@aspectjs/core';
import { HttypedClientAspect } from '../aspects/httyped-client.aspect';
import { HttypedClientConfig } from './client-config.type';

const DEFAULT_CONFIG: Required<HttypedClientConfig> = {
  baseUrl: '',
  requestInit: {},
  fetchAdapter: fetch,
  requestBodyMappers: [],
  responseBodyMappers: [],
};

const configureAspect = () => {
  let clientAspect = getWeaver().getAspects(HttypedClientAspect)[0];

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

  create<C extends ConstructorType>(
    httpClientClass: C,
    args?: ConstructorParameters<C>,
  ): InstanceType<C> {
    const client = Reflect.construct<ConstructorParameters<C>, InstanceType<C>>(
      httpClientClass as any,
      args ?? ([] as any),
    );

    return configureAspect().defineClientConfig(client, this.config);
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
