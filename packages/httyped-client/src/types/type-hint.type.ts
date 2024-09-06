import { ConstructorType } from '@aspectjs/common/utils';

export type TypeHintType<T = unknown> = string | ConstructorType<T>;
