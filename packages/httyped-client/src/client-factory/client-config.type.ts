import { FetchAdapter } from '../types/fetch-adapter.type';
import { MappersRegistry } from '../types/mapper.type';
import { RequestHandler } from '../types/request-handler.type';
import { ResponseHandler } from '../types/response-handler.type';
import { PathVariablesHandler } from './path-variables-handler.type';
import { RequestParamsHandler } from './request-param-handler.type';

/**
 * The configuration for an HttypedClient.
 */
export interface HttypedClientConfig {
  /**
   * The base url of all requests (eg: host plus base route)
   */
  baseUrl: string;
  /**
   * A set of options passed to every requests
   *
   * default: {}
   */
  requestInit?: RequestInit;
  /**
   * The fetch implementation to use. Default: native fetch
   */
  fetchAdapter?: FetchAdapter;
  /**
   * A list of request handlers.
   */
  requestHandlers?: RequestHandler[];
  /**
   * A list of response handlers.
   */
  responseHandlers?: ResponseHandler[];
  /**
   * Responses body can be mapped with these mappers
   */
  responseBodyMappers?: MappersRegistry;
  /**
   * Requests body can be mapped with these mappers
   */
  requestBodyMappers?: MappersRegistry;
  /**
   * Used to customize how path variables are handled
   */
  pathVariablesHandler?: PathVariablesHandler;
  /**
   * Used to customize how request parameters are handled
   */
  requestParamsHandler?: RequestParamsHandler;
}
