export interface Request extends RequestInit {
  url: string;
}

export type RequestHandler = (request: Request) => any;
