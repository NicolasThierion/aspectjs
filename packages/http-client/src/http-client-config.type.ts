import { HttpBackend } from './fetch-adapter.type';

export interface HttpClientConfig {
  baseUrl?: string;
  requestInit?: RequestInit;
  httpBackend?: HttpBackend;
}
