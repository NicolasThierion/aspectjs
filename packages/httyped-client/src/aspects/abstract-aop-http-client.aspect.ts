import {
  AdviceContext,
  AfterReturnContext,
  PointcutKind,
} from '@aspectjs/core';
import { HttypedClientConfig } from '../client-factory/client-config.type';
import { BodyMetadata } from '../types/body-metadata.type';
import { HttpClassMetadata } from '../types/http-class-metadata.type';
import { HttpEndpointMetadata } from '../types/http-endpoint-metadata.type';
import { MapperContext } from '../types/mapper.type';
import { TypeHintType } from '../types/type-hint.type';
import '../url-canparse.polyfill';

export abstract class AbstractAopHttpClientAspect {
  constructor(private readonly aspectId: string) {}

  // Advice methods
  // =====================

  // protected methods
  ////////////////////:

  protected abstract findRequestParams(
    ctxt: AdviceContext<PointcutKind, unknown>,
  ): [string, unknown][];

  protected callHttpAdapter(
    endpointConfig: Required<HttypedClientConfig>,
    url: string,
    requestInit: RequestInit,
  ) {
    return endpointConfig.fetchAdapter(url, requestInit as any);
  }

  protected replacePathVariables(
    url: string,
    endpointConfig: Required<HttypedClientConfig>,
    ctxt: AdviceContext<PointcutKind, unknown>,
  ): string {
    const variableHandler = endpointConfig.pathVariablesHandler;
    const variables = this.findPathVariables(ctxt);

    return variableHandler(url, variables);
  }

  protected handleUrl(
    endpointConfig: Required<HttypedClientConfig>,
    ctxt: AdviceContext,
    url: string,
  ): string {
    let { protocol, host, pathname, hash, searchParams } = new URL(url);
    url = `${protocol}//${host}`;

    if (pathname) {
      pathname = this.replacePathVariables(pathname, endpointConfig, ctxt);

      url = `${url}${pathname}`;
    }

    let requestParamsEntries = [
      ...searchParams.entries(),
      ...this.findRequestParams(ctxt),
    ];

    if (requestParamsEntries.length) {
      const searchParamsString =
        endpointConfig.requestParamsHandler(requestParamsEntries);
      url = `${url}${searchParamsString}`;
    }

    if (hash) {
      url = `${url}${hash}`;
    }

    return url;
  }
  protected abstract findPathVariables(
    ctxt: AdviceContext<PointcutKind, unknown>,
  ): Record<string, any>;

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
    ctxt: AfterReturnContext<PointcutKind.METHOD>,
  ): Promise<any> {
    let mappedResponse: any;
    for (const handler of config.responseHandlers) {
      mappedResponse = await handler(response, config, ctxt);
    }

    return mappedResponse;
  }

  protected setClientConfig(
    config: Required<HttypedClientConfig>,
    clientInstance: InstanceType<any>,
  ) {
    Reflect.defineMetadata(
      `${this.aspectId}:client-config`,
      config,
      clientInstance,
    );
  }

  protected getClientConfig(
    clientInstance: InstanceType<any>,
  ): Required<HttypedClientConfig> {
    return Reflect.getMetadata(
      `${this.aspectId}:client-config`,
      clientInstance,
    );
  }

  protected isManagedInstance(clientInstance: InstanceType<any>) {
    return !!this.getClientConfig(clientInstance);
  }
  /**
   * Extracts the endpoint metadata from the fetch annotation
   */
  protected abstract getEndpointMetadata(
    ctxt: AdviceContext<PointcutKind.METHOD>,
  ): HttpEndpointMetadata;

  /**
   * Extracts the api metadata from the HttpClient annotation
   */

  protected abstract getClassMetadata(
    ctxt: AdviceContext<PointcutKind.METHOD>,
  ): HttpClassMetadata;

  protected mergeConfig(
    config: Required<HttypedClientConfig>,
    classConfig: HttpClassMetadata,
    endpointMetadata: HttpEndpointMetadata,
  ): Required<HttypedClientConfig> {
    const baseUrl = URL.canParse(classConfig.baseUrl ?? '')
      ? classConfig.baseUrl!
      : this.joinUrls(config.baseUrl, classConfig.baseUrl);
    return {
      ...config,
      ...classConfig,
      ...endpointMetadata,
      baseUrl,
    };
  }

  /**
   * Extracts the method body metadata from annotations
   * @param config The config of the HttpClientAspect
   * @param ctxt the advice context
   * @returns the method body metadata
   */
  protected abstract findRequestBodyMetadata(
    ctxt: AdviceContext,
  ): BodyMetadata | undefined;

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
    const bodyMeta = this.findRequestBodyMetadata(ctxt);
    if (!bodyMeta) {
      return;
    }

    const typeHint = bodyMeta.typeHint;
    let body = bodyMeta.value;

    const mappers = config.requestBodyMappers;
    const context: MapperContext = {
      mappers,
      data: {},
    };

    const mapper = mappers.findMapper(typeHint);
    body = mapper ? mapper.map(body, context) : body;
    return typeof body === 'string' ? body : JSON.stringify(body);
  }

  protected abstract findTypeHintAnnotation(
    ctxt: AdviceContext<PointcutKind.METHOD>,
  ): TypeHintType | TypeHintType[] | undefined;

  protected joinUrls(...paths: (string | undefined)[]): string {
    return paths
      .map((u) => u ?? '')
      .map((u) => u.replace(/^\//, ''))
      .filter((url) => url !== '')
      .join('/');
  }
}
