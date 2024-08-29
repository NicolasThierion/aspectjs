import {
  AnnotationContext,
  AnnotationType,
  BoundAnnotationContext,
} from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import {
  AdviceContext,
  AfterReturn,
  AfterReturnContext,
  Aspect,
  AspectError,
  Before,
  BeforeContext,
  PointcutType,
  on,
} from '@aspectjs/core';
import { Body } from '../annotations/body.annotation';
import {
  FETCH_ANNOTATIONS,
  FetchAnnotationContext,
} from '../annotations/fetch/fetch-annotations';
import { HttpClient } from '../annotations/http-client.annotation';
import { FetchAdapter } from '../fetch-adapter.type';
import { HttpClientConfig } from '../http-client-config.type';
import { Mapper } from '../mapper.type';

export interface HttpClientAspectConfig extends HttpClientConfig {
  fetchAdapter?: FetchAdapter;
  responseBodyMappers?: Mapper[];
  requestBodyMappers?: Mapper[];
}

export interface HttpClassMetadata extends HttpClientConfig {}
export interface HttpEndpointMetadata {
  url?: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'option';
  requestInit?: RequestInit;
}

const DEFAULT_ASPECT_CONFIG = {
  baseUrl: '',
  requestInit: {},
  fetchAdapter: fetch,
  requestBodyMappers: [],
  responseBodyMappers: [],
} satisfies Required<HttpClientAspectConfig>;

interface BodyMetadata {
  type: any;
}

@Aspect('@aspectjs/http:client')
export class HttpClientAspect {
  protected readonly config: Required<HttpClientAspectConfig>;
  protected readonly fetchAdapter: FetchAdapter;

  constructor(config?: HttpClientAspectConfig | string) {
    this.config = coerceConfig(config);
    this.fetchAdapter = this.config.fetchAdapter ?? fetch;
  }

  @Before(on.parameters.withAnnotations(Body))
  protected assertBodyImpliesFetch(ctxt: BeforeContext) {
    if (ctxt.target.getMetadata('@ajs/http:assertBodyImpliesFetch')) {
      return;
    }
    if (!this.findFetchAnnotation(ctxt)) {
      throw new AspectError(
        this,
        `${ctxt.target.label} is missing a fetch annotation`,
      );
    }
    ctxt.target.defineMetadata('@ajs/http:assertBodyImpliesFetch', true);
  }

  @AfterReturn(...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)))
  protected fetch(ctxt: AfterReturnContext) {
    let config =
      ctxt.target.getMetadata<Required<HttpClientAspectConfig>>(
        '@ajs/http:config',
      );
    const endpointMetadata = this.getEndpointMedatada(ctxt);
    const classMetadata = this.getClassMetadata(ctxt);

    if (!config) {
      config = this.mergeConfig(this.config, classMetadata, endpointMetadata);

      ctxt.target.defineMetadata('@ajs/http:config', config);
    }

    const requestInit: RequestInit = {
      ...config.requestInit,
      method: endpointMetadata.method,
    };

    const body = this.serializeRequestBody(config, ctxt);
    if (body !== undefined) {
      requestInit.body = body;
    }
    return config.fetchAdapter(
      joinUrls(config.baseUrl, endpointMetadata.url),
      requestInit as any,
    );
  }

  /**
   * Extracts the endpoint metadata from the fetch annotation
   */
  protected getEndpointMedatada(
    ctxt: AfterReturnContext<PointcutType.METHOD>,
  ): HttpEndpointMetadata {
    let metadata =
      ctxt.target.getMetadata<HttpEndpointMetadata>('@ajs/http:endpoint');

    if (metadata) {
      return metadata;
    }
    const fetchAnnotation = this.findFetchAnnotation(ctxt)!;

    let url = fetchAnnotation.args[0] ?? '';

    metadata = {
      url,
      method:
        fetchAnnotation.ref.name.toLowerCase() as HttpEndpointMetadata['method'],
      requestInit: fetchAnnotation.args[1],
    };

    ctxt.target.defineMetadata('@ajs/http:endpoint', metadata);

    assert(!!metadata);
    return metadata!;
  }

  /**
   * Extracts the api metadata from the HttpClient annotation
   */

  protected getClassMetadata(
    ctxt: AfterReturnContext<PointcutType.CLASS>,
  ): HttpClassMetadata {
    let metadata =
      ctxt.target.declaringClass.getMetadata<HttpClassMetadata>(
        '@ajs/http:class',
      );

    if (metadata) {
      return metadata!;
    }

    const httpClientAnnotation = this.findHttpClientAnnotation(ctxt);
    const [arg] = httpClientAnnotation!.args;
    metadata =
      typeof arg === 'string'
        ? {
            baseUrl: arg,
          }
        : arg ?? {};
    ctxt.target.defineMetadata('@ajs/http:class', metadata);

    return metadata!;
  }

  protected mergeConfig(
    config: Required<HttpClientAspectConfig>,
    classConfig: HttpClientConfig,
    endpointMetadata: HttpEndpointMetadata,
  ): Required<HttpClientAspectConfig> {
    const baseUrl =
      classConfig.baseUrl && classConfig.baseUrl.match('.*://.*')
        ? classConfig.baseUrl
        : joinUrls(config.baseUrl, classConfig.baseUrl);
    return {
      ...config,
      ...classConfig,
      ...endpointMetadata,
      baseUrl,
    };
  }

  /**
   * Extracts the method body from metadata
   * @param config The config of the HttpClientAspect
   * @param ctxt the advice context
   * @returns the method body metadata
   */
  protected findBodyAnnotation(
    ctxt: AdviceContext,
  ): BoundAnnotationContext<AnnotationType.PARAMETER, typeof Body> | undefined {
    const bodyAnnotations: AnnotationContext<
      AnnotationType.PARAMETER,
      typeof Body
    >[] = ctxt.annotations(Body).find({ searchParents: true });

    if (bodyAnnotations.length > 1) {
      if (ctxt.annotations(Body).find({ searchParents: false }).length > 1) {
        throw new AspectError(
          this,
          `${ctxt.target.label} is annotated by more that one ${Body} annotations}`,
        );
      }
    }

    return bodyAnnotations[0];
  }

  /**
   * Extracts the method body from metadata, then use the configured mappers to map the body object indo a BodyInit
   * @param config The config of the HttpClientAspect
   * @param ctxt the advice context
   * @returns the method body
   */
  protected serializeRequestBody(
    config: Required<HttpClientAspectConfig>,
    ctxt: AdviceContext,
  ): BodyInit | null | undefined {
    const bodyAnnotation = this.findBodyAnnotation(ctxt);
    if (bodyAnnotation === undefined) {
      return;
    }

    let body = bodyAnnotation.target.eval();

    if (typeof body === undefined) {
      return;
    }

    for (let mapper of config.requestBodyMappers) {
      if (mapper.accepts(body)) {
        body = mapper.map(body);
        break;
      }
    }

    return typeof body === 'string' ? body : JSON.stringify(body);
  }
  protected findFetchAnnotation(ctxt: AdviceContext): FetchAnnotationContext {
    const fetchAnnotations = ctxt
      .annotations(...FETCH_ANNOTATIONS)
      .find({ searchParents: true });

    if (fetchAnnotations.length > 1) {
      if (
        ctxt.annotations(...FETCH_ANNOTATIONS).find({ searchParents: false })
          .length > 1
      ) {
        throw new AspectError(
          this,
          `${
            ctxt.target.label
          } is annotated by more that one fetch annotations: ${fetchAnnotations.join(
            ',',
          )}`,
        );
      }
    }

    const fetchAnnotation = fetchAnnotations[0];

    if (!fetchAnnotation) {
      throw new AspectError(
        this,
        `${ctxt.target.label} is missing a fetch annotation`,
      );
    }
    return fetchAnnotation;
  }

  protected findHttpClientAnnotation(
    ctxt: AdviceContext,
  ): AnnotationContext<AnnotationType.CLASS, typeof HttpClient> {
    const [httpClientAnnotation] = ctxt
      .annotations(HttpClient)
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
  config?: Partial<HttpClientAspectConfig> | string,
): Required<HttpClientAspectConfig> {
  return typeof config === 'string'
    ? {
        ...DEFAULT_ASPECT_CONFIG,
        baseUrl: config,
      }
    : {
        ...DEFAULT_ASPECT_CONFIG,
        ...config,
      };
}

function joinUrls(...paths: (string | undefined)[]): string {
  return paths
    .map((u) => u ?? '')
    .map((u) => u.replace(/^\//, ''))
    .filter((url) => url !== '')
    .join('/');
}
