import { Aspect } from '@aspectjs/core';
import { HttpClientAspect, HttpClientAspectConfig } from './http-client.aspect';

export interface JsonHttpClientAspectConfig extends HttpClientAspectConfig {}
@Aspect()
export class JsonHttpClientAspect extends HttpClientAspect {
  constructor(config?: JsonHttpClientAspectConfig | string) {
    super(config);
  }
}
