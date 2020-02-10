import { Weaver } from './weaver/weaver';
import { LoadTimeWeaver } from './weaver/load-time/load-time-weaver';

let _weaver: Weaver = new LoadTimeWeaver();
export function getWeaver(): Weaver {
    return _weaver;
}

export function setWeaver(weaver: Weaver): void {
    _weaver = weaver;
}
