import { FetchAdapter } from './fetch-adapter.type';

export interface HttpClientConfig {
  baseUrl?: string;
  requestInit?: RequestInit;
  fetchAdapter?: FetchAdapter;
}
