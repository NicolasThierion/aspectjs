import { Weaver } from './weaver';
import { AdvicesRegistry } from '../advice/advice-registry';

export class WeaverContext {
    private _weaver: Weaver;
    readonly advicesRegistry: AdvicesRegistry = new AdvicesRegistry();

    getWeaver(): Weaver {
        return this._weaver;
    }
    setWeaver(weaver: Weaver): void {
        this._weaver = weaver;
    }
}
export const weaverContext = new WeaverContext();
