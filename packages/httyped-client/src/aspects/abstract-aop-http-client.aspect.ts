import {
  AdviceContext,
  AfterReturnContext,
  AspectError,
  PointcutType,
} from '@aspectjs/core';
import { PathVariable } from '../annotations/path-variable.annotation';
import { HttypedClientConfig } from '../client-factory/client-config.type';
import {
  MissingPathVariableError,
  PathVariableNotMatchedError,
} from '../client-factory/path-variables-handler.type';
import { BodyMetadata } from '../types/body-metadata.type';
import { HttpClassMetadata } from '../types/http-class-metadata.type';
import { HttpEndpointMetadata } from '../types/http-endpoint-metadata.type';
import { MapperContext } from '../types/mapper.type';
import '../url-canparse.polyfill';

export abstract class AbstractAopHttpClientAspect {
  constructor(private readonly aspectId: string) {}

  // Advice methods
  // =====================

  // protected methods
  ////////////////////:

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
    ctxt: AdviceContext<PointcutType, unknown>,
  ): string {
    const variableHandler = endpointConfig.pathVariablesHandler;
    const variables = this.findPathVariables(ctxt);

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
  protected abstract findPathVariables(
    ctxt: AdviceContext<PointcutType, unknown>,
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
    ctxt: AfterReturnContext<PointcutType.METHOD>,
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
    ctxt: AdviceContext<PointcutType.METHOD>,
  ): HttpEndpointMetadata;

  /**
   * Extracts the api metadata from the HttpClient annotation
   */

  protected abstract getClassMetadata(
    ctxt: AdviceContext<PointcutType.METHOD>,
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
    ctxt: AdviceContext<PointcutType.METHOD>,
  ): Function | string | undefined;

  protected joinUrls(...paths: (string | undefined)[]): string {
    return paths
      .map((u) => u ?? '')
      .map((u) => u.replace(/^\//, ''))
      .filter((url) => url !== '')
      .join('/');
  }
}
