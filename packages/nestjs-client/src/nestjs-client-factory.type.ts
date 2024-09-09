import { getWeaver } from '@aspectjs/core';
import { HttypedClientConfig, HttypedClientFactory } from 'httyped-client';
import { NestClientMixinAspect } from './nestjs-client-mixin.aspect';

export class NestClientFactory extends HttypedClientFactory {
  constructor(config?: HttypedClientConfig | HttypedClientFactory) {
    super(config);

    if (!getWeaver().getAspect(NestClientMixinAspect)) {
      getWeaver().enable(new NestClientMixinAspect());
    }
  }
}
