import { assert } from '@aspectjs/common/utils';
import {
  AfterReturn,
  AfterReturnContext,
  Aspect,
  AspectError,
  Before,
  Compile,
  PointcutType,
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
@Aspect('@aspectjs/http:client')
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
    ctxt: AfterReturnContext<PointcutType.METHOD>,
  ) {
    const fetchAnnotation = this.findFetchAnnotation(ctxt);
    let url = fetchAnnotation.args[0] ?? '';
    ctxt.target.defineMetadata('@ajs/http:endpoint', {
      url,
      method: fetchAnnotation.ref.name.toLowerCase(),
      requestInit: fetchAnnotation.args[1],
    } satisfies EndpointMetadata);
  }

  /**
   * Extracts the api metadata from the HttpClient annotation
   */
  @Before(...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)))
  protected defineClassMetadata(ctxt: AfterReturnContext<PointcutType.CLASS>) {
    let metadata = ctxt.target.getMetadata<HttpApiMetadata>('@ajs/http:api');

    if (metadata) {
      return;
    }

    const httpClientAnnotation = this.findHttpClientAnnotation(ctxt);
    const [arg] = httpClientAnnotation!.args;

    assert(!!arg);
    metadata =
      typeof arg === 'string'
        ? {
            baseUrl: arg,
          }
        : arg ?? {};

    ctxt.target.defineMetadata(
      '@ajs/http:api',
      metadata satisfies HttpApiMetadata,
    );
  }

  @AfterReturn(...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)))
  fetch(ctxt: AfterReturnContext) {
    const classMetadata = this.getClassMetadata(ctxt);
    const endpointMetadata = this.getEndpointMedatada(ctxt);

    const config = this.mergeConfig(
      this.config,
      classMetadata,
      endpointMetadata,
    );

    const requestInit: RequestInit = {
      ...config.requestInit,
      method: endpointMetadata.method,
    };
    const body = this.getBody(config, ctxt);
    if (body !== undefined) {
      requestInit.body = body;
    }
    return config.httpBackend(
      joinUrls(config.baseUrl, endpointMetadata.url),
      requestInit as any,
    );
  }

  getEndpointMedatada(
    ctxt: AfterReturnContext<PointcutType.METHOD>,
  ): EndpointMetadata {
    const metadata =
      ctxt.target.getMetadata<EndpointMetadata>('@ajs/http:endpoint');
    assert(!!metadata);
    return metadata;
  }

  getClassMetadata(
    ctxt: AfterReturnContext<PointcutType.CLASS>,
  ): HttpApiMetadata {
    const metadata = ctxt.target.getMetadata<EndpointMetadata>('@ajs/http:api');
    assert(!!metadata);
    return metadata;
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
      ctxt.annotations.filter(Body).find()[0]?.target.eval() ?? undefined;
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
          this,
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
    const [httpClientAnnotation] = ctxt.annotations
      .filter(HttpClient)
      .find({ searchParents: true });

    if (!httpClientAnnotation) {
      throw new AspectError(
        this,
        `${ctxt.target.declaringClass} is missing the ${HttpClient} annotation`,
      );
    }
    return httpClientAnnotation;
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
