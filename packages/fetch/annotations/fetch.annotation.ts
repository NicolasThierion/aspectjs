import { ASPECTJS_ANNOTATION_FACTORY } from '@aspectjs/core/commons';

export type RequestHandler = (req: Request) => Request | undefined;
export type ResponseHandler = (res: Response) => Response | undefined;

export interface FetchClientOptions {
    url?: string;
    requestHandlers?: RequestHandler[];
    responseHandlers?: ResponseHandler[];
}

export const FetchClient = ASPECTJS_ANNOTATION_FACTORY.create(
    'FetchClient',
    (arg: string | FetchClientOptions): ClassDecorator => {
        return;
    },
);
