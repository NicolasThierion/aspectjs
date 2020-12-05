import { ASPECTJS_ANNOTATION_FACTORY } from '@aspectjs/core/commons';
import { FetchEndpointOptions } from './fetch-endpoint-option';

export const Patch = ASPECTJS_ANNOTATION_FACTORY.create(
    'Patch',
    (arg: string | FetchEndpointOptions): MethodDecorator => {
        return;
    },
);
