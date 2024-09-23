import { getWeaver } from '@aspectjs/core';
import {
  HttypedClientAspect,
  HttypedClientConfig,
  HttypedClientFactory,
} from 'httyped-client';
import { NestClientAspect } from './nestjs-client.aspect';

export class NestClientFactory extends HttypedClientFactory {
  constructor(config?: HttypedClientConfig | HttypedClientFactory) {
    super(config);
  }

  protected override registerAspect(): HttypedClientAspect & object {
    let clientAspect = getWeaver().getAspect(NestClientAspect);

    if (clientAspect) {
      return clientAspect;
    }
    clientAspect = new NestClientAspect();
    getWeaver().enable(clientAspect);
    return clientAspect;
  }
}
