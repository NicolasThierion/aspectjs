import { WeaverProfile } from './profile';
import { Aspect } from './types';
import { PointcutName } from './advices/types';
import { MutableAdviceContext } from './advices/advice-context';

type _PointcutsRunners = {
    [type in 'class' | 'property' | 'method' | 'parameter']: {
        [k in PointcutName]: (ctxt: MutableAdviceContext<any>) => any;
    };
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PointcutsRunner extends _PointcutsRunners {}

export interface Weaver extends WeaverProfile {
    enable(...aspects: Aspect[]): this;
    disable(...aspects: Aspect[]): this;
    merge(...profiles: WeaverProfile[]): this;
    setProfile(profile: WeaverProfile): this;
    load(): PointcutsRunner;
    reset(): this;
    isLoaded(): boolean;
}
