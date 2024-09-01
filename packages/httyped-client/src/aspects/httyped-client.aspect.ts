import {
  AnnotationContext,
  AnnotationType,
  BoundAnnotationContext,
  getAnnotations,
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
import { HttypedClient } from '../annotations/http-client.annotation';
import { PathVariable } from '../annotations/path-variable.annotation';
import { Type } from '../annotations/type.annotation';
import { HttypedClientConfig } from '../client-factory/client-config.type';
import {
  MissingPathVariableError,
  PathVariableNotMatchedError,
} from '../client-factory/path-variables-handler.type';
import { HttpClassMetadata } from '../types/http-class-metadata.type';
import { HttpEndpointMetadata } from '../types/http-endpoint-metadata.type';
import { MapperContext } from '../types/mapper.type';
import type { Request } from '../types/request-handler.type';
import '../url-canparse.polyfill';

@Aspect('@aspectjs/http:client')
export class HttypedClientAspect {
  constructor() {}

  defineClientConfig<T>(clientInstance: T, config: HttypedClientConfig): T {
    const ctor = Object.getPrototypeOf(clientInstance).constructor;
    const httypedAnnotation = getAnnotations(HttypedClient)
      .onClass(ctor)
      .find({ searchParents: true });

    if (!httypedAnnotation.length) {
      throw new AspectError(
        this,
        `class ${ctor.name} is missing the ${HttypedClient} annotation`,
      );
    }

    Reflect.defineMetadata('@ajs/http:client-config', config, clientInstance!);
    return clientInstance;
  }

  @Before(on.parameters.withAnnotations(Body))
  protected assertBodyImpliesFetch(
    ctxt: BeforeContext<PointcutType.PARAMETER>,
  ) {
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
    let config = this.getClientConfig(ctxt);
    if (!config) {
      // not received a client config = not created through the HttypedClientFactory.
      return;
    }

    const endpointMetadata = this.getEndpointMedatada(ctxt);
    const classMetadata = this.getClassMetadata(ctxt);

    const endpointConfig = this.mergeConfig(
      config,
      classMetadata,
      endpointMetadata,
    );

    let url = joinUrls(endpointConfig.baseUrl, endpointMetadata.url);

    url = this.replacePathVariables(url, endpointConfig, ctxt);

    let requestInit: Request = {
      ...endpointConfig.requestInit,
      method: endpointMetadata.method,
      url,
    };
    const body = this.serializeRequestBody(endpointConfig, ctxt);
    if (body !== undefined) {
      requestInit.body = body;
    }

    requestInit = this.applyRequestHandlers(config, requestInit);
    url = requestInit.url;

    delete (requestInit as Partial<Request> & RequestInit).url;

    return this.callHttpAdapter(endpointConfig, url, requestInit).then(
      async (r) => this.applyResponseHandlers(config, r as Response),
    );
  }
  callHttpAdapter(
    endpointConfig: Required<HttypedClientConfig>,
    url: string,
    requestInit: RequestInit,
  ) {
    return endpointConfig.fetchAdapter(url, requestInit as any);
  }
  protected replacePathVariables(
    url: string,
    endpointConfig: Required<HttypedClientConfig>,
    ctxt: AfterReturnContext<PointcutType, unknown>,
  ): string {
    const variableHandler = endpointConfig.pathVariablesHandler;

    const variables = ctxt
      .annotations(PathVariable)
      .find({ searchParents: true })
      .reduce(
        (variables, annotation) => {
          return {
            ...variables,
            [annotation.args[0]]: annotation.target.eval(),
          };
        },
        {} as Record<string, any>,
      );

    try {
      return variableHandler.replace(url, variables);
    } catch (e) {
      if (e instanceof MissingPathVariableError) {
        throw new AspectError(
          this,
          `${PathVariable}(${e.variable}) parameter is missing for ${ctxt.target.label}`,
        );
      } else if (e instanceof PathVariableNotMatchedError) {
        throw new AspectError(
          this,
          `${PathVariable}(${e.variable}) parameter of ${ctxt.target.label} does not match url ${url}`,
        );
      } else {
        throw e;
      }
    }
  }
  protected applyRequestHandlers(
    config: Required<HttypedClientConfig>,
    requestInit: Request,
  ) {
    for (const h of config.requestHandlers) {
      requestInit = h(requestInit) ?? requestInit;
    }
    return requestInit;
  }

  protected async applyResponseHandlers(
    config: Required<HttypedClientConfig>,
    response: Response,
  ): Promise<any> {
    let mappedResponse: any;
    for (const handler of config.responseHandler) {
      mappedResponse = await handler(response);
    }

    return mappedResponse;
  }

  protected getClientConfig(
    ctxt: AfterReturnContext,
  ): Required<HttypedClientConfig> {
    return Reflect.getMetadata('@ajs/http:client-config', ctxt.instance!);
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
    config: Required<HttypedClientConfig>,
    classConfig: HttpClassMetadata,
    endpointMetadata: HttpEndpointMetadata,
  ): Required<HttypedClientConfig> {
    const baseUrl = URL.canParse(classConfig.baseUrl ?? '')
      ? classConfig.baseUrl!
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
    config: Required<HttypedClientConfig>,
    ctxt: AdviceContext,
  ): BodyInit | undefined {
    const bodyAnnotation = this.findBodyAnnotation(ctxt);
    if (bodyAnnotation === undefined) {
      return;
    }

    let body = bodyAnnotation.target.eval();

    if (typeof body === undefined) {
      return;
    }
    const typeHint =
      ctxt.annotations(Type).find({ searchParents: true })[0]?.args[0] ??
      (
        bodyAnnotation.target.parent.getMetadata(
          'design:paramtypes',
        ) as unknown[]
      )[bodyAnnotation.target.parameterIndex];

    const mappers = config.requestBodyMappers;
    const context: MapperContext = {
      typeHint,
      mappers,
    };
    for (let mapper of mappers) {
      if (mapper.accepts(body, context)) {
        body = mapper.map(body, context);
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
      const label =
        ctxt.target.type === AnnotationType.PARAMETER
          ? ctxt.target.parent.label
          : ctxt.target.label;

      throw new AspectError(this, `${label} is missing a fetch annotation`);
    }
    return fetchAnnotation;
  }

  protected findHttpClientAnnotation(
    ctxt: AdviceContext,
  ): AnnotationContext<AnnotationType.CLASS, typeof HttypedClient> {
    const [httpClientAnnotation] = ctxt
      .annotations(HttypedClient)
      .find({ searchParents: true });

    if (!httpClientAnnotation) {
      throw new AspectError(
        this,
        `${ctxt.target.declaringClass} is missing the ${HttypedClient} annotation`,
      );
    }
    return httpClientAnnotation;
  }
}

function joinUrls(...paths: (string | undefined)[]): string {
  return paths
    .map((u) => u ?? '')
    .map((u) => u.replace(/^\//, ''))
    .filter((url) => url !== '')
    .join('/');
}
