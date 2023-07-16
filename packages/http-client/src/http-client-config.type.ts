import { HttpClientRequestHandler } from './request-handler.type';
import { HttpClientResponseHandler } from './response-handler.type';

export interface HttpClientConfig {
  baseUrl?: string;
  requestHandler?: HttpClientRequestHandler;
  responseHandler?: HttpClientResponseHandler;
}
