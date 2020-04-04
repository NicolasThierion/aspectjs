import { WeaverProfile } from './profile';
import { MutableAdviceContext } from './advices/advice-context';
import { PointcutPhase } from './advices/pointcut';

export type AdviceRunners = {
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

export interface Weaver extends WeaverProfile {
    enable(...aspects: any[]): this;
    disable(...aspects: any[]): this;
    merge(...profiles: WeaverProfile[]): this;
    setProfile(profile: WeaverProfile): this;
    load(): AdviceRunners;
    reset(): this;
    isLoaded(): boolean;
}

let _weaver: Weaver;
export function getWeaver(): Weaver {
    return _weaver;
}

export function setWeaver(weaver: Weaver): void {
    _weaver = weaver;
}
