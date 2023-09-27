import { assert } from '@aspectjs/common/utils';
import {
  AfterReturn,
  AfterReturnContext,
  Aspect,
  AspectError,
  Compile,
  JoinpointType,
  on,
} from '@aspectjs/core';
import { Body } from '../annotations/body.annotation';
import {
  FETCH_ANNOTATIONS,
  FetchAnnotationContext,
} from '../annotations/fetch/fetch-annotations';
import { HttpClient } from '../annotations/http-client.annotation';
import { HttpBackend } from '../fetch-adapter.type';
import { HttpClientConfig } from '../http-client-config.type';

export interface HttpClientAspectConfig extends HttpClientConfig {
  httpBackend: HttpBackend;
}

export interface HttpApiMetadata extends HttpClientConfig {}

const DEFAULT_CONFIG = {
  baseUrl: '',
  requestInit: {},
} satisfies HttpClientConfig;

interface EndpointMetadata {
  url?: string;
  method: string;
  requestInit?: RequestInit;
}
@Aspect()
export class HttpClientAspect {
  protected readonly config: HttpClientAspectConfig;
  protected readonly httpBackend!: HttpBackend;

  constructor(config?: HttpClientAspectConfig | string) {
    this.config = coerceConfig(config);
    this.httpBackend = this.config.httpBackend ?? fetch;
  }

  /**
   * Extracts the endpoint metadata from the fetch annotation
   */
  @Compile(...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)))
  protected defineEndpointMedatada(
    ctxt: AfterReturnContext<JoinpointType.METHOD>,
  ) {
    const fetchAnnotation = this.findFetchAnnotation(ctxt);
    ctxt.target.defineMetadata('@aspectjs/http:endpoint', {
      url: fetchAnnotation.args[0],
      method: fetchAnnotation.ref.name.toLowerCase(),
      requestInit: fetchAnnotation.args[1],
    } satisfies EndpointMetadata);
  }

  protected getEndpointMedatada(
    ctxt: AfterReturnContext<JoinpointType.METHOD>,
  ): EndpointMetadata {
    const metadata = ctxt.target.getMetadata<EndpointMetadata>(
      '@aspectjs/http:endpoint',
    );
    assert(!!metadata);
    return metadata;
  }

  /**
   * Extracts the api metadata from the HttpClient annotation
   */
  @Compile(...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)))
  protected defineApiMetadata(ctxt: AfterReturnContext<JoinpointType.METHOD>) {
    const httpClientAnnotation = this.findHttpClientAnnotation(ctxt);
    const arg = httpClientAnnotation.args[0];

    const metadata =
      typeof arg === 'string'
        ? {
            baseUrl: arg,
          }
        : arg ?? {};

    ctxt.target.defineMetadata(
      '@aspectjs/http:api',
      metadata satisfies HttpApiMetadata,
    );
  }

  protected getApiMetadata(
    ctxt: AfterReturnContext<JoinpointType.METHOD>,
  ): HttpApiMetadata {
    // TODO: write ctxt.target.getOwnMetadata
    return ctxt.target.getMetadata<EndpointMetadata>('@aspectjs/http:api');
  }

  @AfterReturn(...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)))
  fetch(ctxt: AfterReturnContext) {
    const apiMetadata = this.getApiMetadata(ctxt);

    const endpointMetadata = this.getEndpointMedatada(ctxt);
    const config = this.mergeConfig(this.config, apiMetadata, endpointMetadata);

    return config.httpBackend(joinUrls(config.baseUrl, endpointMetadata.url), {
      method: endpointMetadata.method,
      body: this.getBody(config, ctxt) as any,
    } satisfies RequestInit);
  }

  protected mergeConfig(
    config: HttpClientAspectConfig,
    classConfig: HttpClientConfig,
    endpointMetadata: EndpointMetadata,
  ): HttpClientAspectConfig {
    return {
      ...config,
      ...classConfig,
      ...endpointMetadata,
      baseUrl: joinUrls(config.baseUrl, classConfig.baseUrl),
    };
  }

  /**
   * Extracts the method body from metadata
   * @param config The config of the HttpClientAspect
   * @param ctxt the advice context
   * @returns the method body
   */
  protected getBody(
    _config: HttpClientAspectConfig,
    ctxt: AfterReturnContext,
  ): BodyInit | null | undefined {
    const body =
      ctxt.annotations.filter(Body).find()[0]?.target.value ?? undefined;
    if (body === undefined) {
      return;
    }
    return typeof body === 'string' ? body : JSON.stringify(body);
  }

  protected findFetchAnnotation(
    ctxt: AfterReturnContext,
  ): FetchAnnotationContext {
    const fetchAnnotations = ctxt.annotations
      .filter(...FETCH_ANNOTATIONS)
      .find({ searchParents: true });
    if (fetchAnnotations.length > 1) {
      if (
        ctxt.annotations
          .filter(...FETCH_ANNOTATIONS)
          .find({ searchParents: false }).length > 1
      ) {
        throw new AspectError(
          `${
            ctxt.target.label
          } is annotated by multiple fetch annotations: ${fetchAnnotations.join(
            ',',
          )}`,
        );
      }
    }

    return fetchAnnotations[0] as any as FetchAnnotationContext;
  }

  protected findHttpClientAnnotation(ctxt: AfterReturnContext) {
    const httpClientAnnotations = ctxt.annotations
      .filter(HttpClient)
      .find({ searchParents: true });
    if (httpClientAnnotations.length < 1) {
      throw new AspectError(
        `${ctxt.target.declaringClass} is missing the ${HttpClient} annotation`,
      );
    }

    return httpClientAnnotations[0]!;
  }
}

function coerceConfig(
  config?: HttpClientAspectConfig | string,
): Required<HttpClientAspectConfig> {
  if (typeof config === 'string') {
    return {
      ...DEFAULT_CONFIG,
      baseUrl: config,
      httpBackend: fetch,
    };
  } else if (typeof config === 'object') {
    return {
      ...DEFAULT_CONFIG,
      ...config,
      httpBackend: config.httpBackend ?? fetch,
    };
  } else {
    return { ...DEFAULT_CONFIG, httpBackend: fetch };
  }
}

function joinUrls(...paths: (string | undefined)[]): string {
  return paths
    .map((u) => u ?? '')
    .map((u) => u.replace(/^\//, ''))
    .filter((url) => url !== '')
    .join('/');
}
