import { Aspect } from '@aspectjs/core';
import { HttypedClientConfig } from '../client-factory/client-config.type';
import { HttypedClientAspect } from './httyped-client.aspect';

/**
 * @deprecated
 */
export interface JsonHttpClientAspectConfig extends HttypedClientConfig {}

/**
 * @deprecated
 */
@Aspect()
export class JsonHttpClientAspect extends HttypedClientAspect {
  constructor(config?: JsonHttpClientAspectConfig | string) {
    super(config);
  }
}
