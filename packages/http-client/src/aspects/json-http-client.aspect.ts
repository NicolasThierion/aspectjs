import { Aspect } from '@aspectjs/core';
import { HttpClientAspect, HttpClientAspectConfig } from './http-client.aspect';

@Aspect()
export class JsonHttpClientAspect extends HttpClientAspect {
  constructor(config?: HttpClientAspectConfig | string) {
    super({
      requestHandler: (r) => r,
      responseHandler: (r) => r.json(),
      ...coerceConfig(config),
    });
  }
}

function coerceConfig(
  config?: HttpClientAspectConfig | string,
): HttpClientAspectConfig {
  if (typeof config === 'string') {
    return {
      baseUrl: config,
    };
  } else {
    return config ?? {};
  }
}
