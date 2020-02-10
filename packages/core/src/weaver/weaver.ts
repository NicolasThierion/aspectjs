import { WeaverProfile } from './profile';
import { MutableAdviceContext } from './advices/advice-context';
import { PointcutPhase } from './advices/pointcut';

type _PointcutsRunners = {
    [type in 'class' | 'method' | 'parameter']: {
        [k in PointcutPhase]: (ctxt: MutableAdviceContext<any>) => any;
    };
} & {
    property: {
        [k in 'getter' | 'setter']: {
            [PointcutPhase.AROUND]: (ctxt: MutableAdviceContext<any>) => any;
            [PointcutPhase.BEFORE]: (ctxt: MutableAdviceContext<any>) => any;
            [PointcutPhase.AFTERRETURN]: (ctxt: MutableAdviceContext<any>) => any;
            [PointcutPhase.AFTER]: (ctxt: MutableAdviceContext<any>) => any;
            [PointcutPhase.AFTERTHROW]: (ctxt: MutableAdviceContext<any>) => any;
        };
    } & {
        [PointcutPhase.COMPILE]: (ctxt: MutableAdviceContext<any>) => any;
    };
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PointcutsRunner extends _PointcutsRunners {}

export interface Weaver extends WeaverProfile {
    enable(...aspects: any[]): this;
    disable(...aspects: any[]): this;
    merge(...profiles: WeaverProfile[]): this;
    setProfile(profile: WeaverProfile): this;
    load(): PointcutsRunner;
    reset(): this;
    isLoaded(): boolean;
}
