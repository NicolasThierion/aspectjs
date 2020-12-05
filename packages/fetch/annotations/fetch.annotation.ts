import { ASPECTJS_ANNOTATION_FACTORY } from '@aspectjs/core/commons';

export interface FetchClientOptions {
    url?: string;
}

export const FetchClient = ASPECTJS_ANNOTATION_FACTORY.create(
    'FetchClient',
    (arg: string | FetchClientOptions): ClassDecorator => {
        return;
    },
);
