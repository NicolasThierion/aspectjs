import { ASPECTJS_ANNOTATION_FACTORY } from '@aspectjs/core/commons';
import { FetchEndpointOptions } from './fetch-endpoint-option';

export const Post = ASPECTJS_ANNOTATION_FACTORY.create(
    'Post',
    (arg: string | FetchEndpointOptions): MethodDecorator => {
        return;
    },
);
