import { RequestHandler } from '../types/request-handler.type';

export const CONTENT_TYPE_JSON_REQUEST_HANDLER: RequestHandler = (
  req: Request,
) => {
  req.headers.set(
    'Content-Type',
    req.headers.get('Content-Type') ?? 'application/json',
  );
};
