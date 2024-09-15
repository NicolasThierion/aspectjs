export interface HttpEndpointMetadata {
  url?: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'option';
  requestInit?: RequestInit;
}
