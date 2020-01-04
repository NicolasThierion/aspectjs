import { Weaver } from './weaver/weaver';
import { LoadTimeWeaver } from './weaver/load-time/load-time-weaver';

const DEFAULT_WEAVER_NAME = 'default';
const _weaverStore: Record<string, Weaver> = { [DEFAULT_WEAVER_NAME]: new LoadTimeWeaver() };
export function getWeaver(groupId = DEFAULT_WEAVER_NAME): Weaver {
    return _weaverStore[groupId];
}

export function setWeaver(weaver: Weaver, groupId = DEFAULT_WEAVER_NAME): void {
    _weaverStore[groupId] = weaver;
}

export * from './weaver/types';
export * from './annotation/annotation.types';
