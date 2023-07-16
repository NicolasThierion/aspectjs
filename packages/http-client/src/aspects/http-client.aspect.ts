import {
  AfterContext,
  AfterReturn,
  Aspect,
  AspectError,
  on,
} from '@aspectjs/core';
import { FETCH_ANNOTATIONS } from '../annotations/fetch/fetch-annotations';
import { HttpClient } from '../annotations/http-client.annotation';
import { HttpClientConfig } from '../http-client-config.type';
import { HttpClientRequestHandler } from '../request-handler.type';
import { HttpClientResponseHandler } from '../response-handler.type';

export interface HttpClientAspectConfig extends HttpClientConfig {}

const DEFAULT_CONFIG = {
  baseUrl: '',
  requestHandler: new HttpClientRequestHandler(),
  responseHandler: new HttpClientResponseHandler(),
} satisfies Required<HttpClientAspectConfig>;

@Aspect()
export class HttpClientAspect {
  protected readonly config: Required<HttpClientAspectConfig>;

  constructor(config?: HttpClientAspectConfig | string) {
    if (typeof config === 'string') {
      this.config = {
        ...DEFAULT_CONFIG,
        baseUrl: config,
      };
    } else if (typeof config === 'object') {
      this.config = {
        ...DEFAULT_CONFIG,
        ...config,
      };
    } else {
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  @AfterReturn(...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)))
  fetch(ctxt: AfterContext) {
    const localArg =
      ctxt.annotations.filter(HttpClient).find()[0]?.args[0] ?? {};
    const localConfig: HttpClientConfig =
      typeof localArg === 'string' ? { baseUrl: localArg } : localArg;

    const config = {
      ...this.config,
      ...localConfig,
    };
    const fetchAnnotations = ctxt.annotations
      .filter(...FETCH_ANNOTATIONS)
      .find({ searchParents: true });
    if (fetchAnnotations.length > 1) {
      throw new AspectError(
        `${
          ctxt.target.label
        } is annotated by multiple fetch annotations: ${fetchAnnotations.join(
          ',',
        )}`,
      );
    }

    const fetchAnnotation = fetchAnnotations[0]!;
    const method = fetchAnnotation.ref.name.toLowerCase();
    const url = [
      config.baseUrl,
      (fetchAnnotation.args[0] ?? '').replace(/^\//, ''),
    ].join('/');

    return config.requestHandler
      .doRequest()
      .httpBackend(url, requestInit)
      .then((r: Response) => this.config.responseHandler(r));
  }
}
