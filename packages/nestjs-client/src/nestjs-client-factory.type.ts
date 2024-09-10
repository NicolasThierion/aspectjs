import { getWeaver } from '@aspectjs/core';
import { HttypedClientConfig, HttypedClientFactory } from 'httyped-client';
import { NestClientMixin } from './nestjs-client-mixin';

export class NestClientFactory extends HttypedClientFactory {
  constructor(config?: HttypedClientConfig | HttypedClientFactory) {
    super(config);

    if (!getWeaver().getAspect('NestClientMixin')) {
      getWeaver().enable(new NestClientMixin().createAspect());
    }
  }
}
