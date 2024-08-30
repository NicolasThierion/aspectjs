import { FetchAdapter } from '../fetch-adapter.type';
import { Mapper } from '../mapper.type';

export interface HttypedClientConfig {
  baseUrl?: string;
  requestInit?: RequestInit;
  fetchAdapter?: FetchAdapter;
  responseBodyMappers?: Mapper[];
  requestBodyMappers?: Mapper[];
}
