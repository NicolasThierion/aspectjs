import { WeaverProfile } from '../profile';
import { assert, getOrDefault } from '../../utils';
import {
    Advice,
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AnnotationAspectPointcutRunners,
    AroundAdvice,
    Aspect,
    BeforeAdvice,
    MethodPointCutHooks,
    POINTCUT_NAMES,
    SetupAdvice,
} from '../types';
import { WeavingError } from '../weaving-error';
import { AnnotationContext } from '../../annotation/context/context';
import { AnnotationType } from '../..';
import { AnnotationAspectContext } from '../annotation-aspect-context';

type AdviceRegistry = { [k in keyof MethodPointCutHooks]?: Advice<any>[] };

export class Weaver extends WeaverProfile {
    private _advices: AdviceRegistry;
    public run: (ctxt: AnnotationAspectContext<any, AnnotationType>) => AnnotationAspectPointcutRunners;
    constructor(name?: string) {
        super(name);
        this.run = _createPointcutRunners(this);
        Object.seal(this.run);
    }

    enable(...aspects: Aspect[]): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot enable or disable aspects`);
        return super.enable(...aspects);
    }
    disable(...aspects: Aspect[]): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot enable or disable aspects`);
        return super.disable(...aspects);
    }
    merge(...profiles: WeaverProfile[]): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot change profile`);
        return super.merge(...profiles);
    }
    setProfile(profile: WeaverProfile): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot change profile`);
        return super.reset().merge(profile);
    }
    load(): void {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded`);
        this._advices = POINTCUT_NAMES.reduce((acc, c) => {
            acc[c] = [];
            return acc;
        }, {} as AdviceRegistry);

        this._advices = Object.values(this._aspects)
            .map(Object.values)
            .flat()
            .reduce((acc, c) => {
                Object.entries(c).forEach(e => {
                    getOrDefault(acc, e[0], () => []).push((e[1] as any).advice);
                });
                return acc;
            }, this._advices);
    }

    reset(): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot reset change its configuration anymore`);
        return super.reset();
    }
    isLoaded(): boolean {
        return !!this._advices;
    }

    private _assertNotCompiled(msg: string) {
        if (this._advices) {
            throw new WeavingError(msg);
        }
    }
    getAdvices(pointCutName: 'setup'): SetupAdvice<any>[];
    getAdvices(pointCutName: 'before'): BeforeAdvice<any>[];
    getAdvices(pointCutName: 'after'): AfterAdvice<any>[];
    getAdvices(pointCutName: 'afterReturn'): AfterReturnAdvice<any>[];
    getAdvices(pointCutName: 'afterThrow'): AfterThrowAdvice<any>[];
    getAdvices(pointCutName: 'around'): AroundAdvice<any>[];
    getAdvices(pointCutName: keyof MethodPointCutHooks): Advice<any>[] {
        return [...this._advices[pointCutName]];
    }
}

function _createPointcutRunners(
    weaver: Weaver,
): (ctxt: AnnotationAspectContext<any, AnnotationType>) => AnnotationAspectPointcutRunners {
    const runners = {
        class: {
            setup: () => assert(false, 'not implemented'),
            before: () => assert(false, 'not implemented'),
            around: () => assert(false, 'not implemented'),
            afterReturn: () => assert(false, 'not implemented'),
            afterThrow: () => assert(false, 'not implemented'),
            after: () => assert(false, 'not implemented'),
        },
        property: {
            setup: () => assert(false, 'not implemented'),
            before: () => assert(false, 'not implemented'),
            around: () => assert(false, 'not implemented'),
            afterReturn: () => assert(false, 'not implemented'),
            afterThrow: () => assert(false, 'not implemented'),
            after: () => assert(false, 'not implemented'),
        },
        method: {
            setup: () => assert(false, 'not implemented'),
            before: () => assert(false, 'not implemented'),
            around: () => assert(false, 'not implemented'),
            afterReturn: () => assert(false, 'not implemented'),
            afterThrow: () => assert(false, 'not implemented'),
            after: () => assert(false, 'not implemented'),
        },
        parameter: {
            setup: () => assert(false, 'not implemented'),
            before: () => assert(false, 'not implemented'),
            around: () => assert(false, 'not implemented'),
            afterReturn: () => assert(false, 'not implemented'),
            afterThrow: () => assert(false, 'not implemented'),
            after: () => assert(false, 'not implemented'),
        },
    };

    let _ctxt: AnnotationAspectContext<any, AnnotationType> = null;
    runners.class.before = () => {
        weaver.getAdvices('before').forEach((advice: BeforeAdvice<unknown>) => advice(_ctxt));
    };

    return (ctxt: AnnotationAspectContext<any, AnnotationType>) => {
        _ctxt = ctxt;
        return runners;
    };
}
//
// function _(weaver: Weaver) {
//     const aroundAdvices = weaver.getAdvices('around');
//     if (aroundAdvices.length) {
//         // allow call to fake 'this'
//         instanceResolver.resolve(partialThis);
//         const oldJp = jp;
//         jp = jpf.create(
//             (args: any[]) => {
//                 if (instanceResolver.isDirty()) {
//                     throw new Error(`Cannot get "this" instance of constructor before joinpoint has been called`);
//                 }
//                 instanceResolver.resolve(oldJp(args));
//             },
//             () => ctorArgs,
//         );
//
//         let aroundAdvice = aroundAdvices.shift();
//
//         let previousArgs = ctorArgs;
//         while (aroundAdvices.length) {
//             const previousAroundAdvice = aroundAdvice;
//             aroundAdvice = aroundAdvices.shift();
//             const previousJp = jp;
//             jp = jpf.create(
//                 (...args: any[]) => {
//                     previousArgs = args ?? previousArgs;
//                     previousAroundAdvice(ctxt, previousJp, args);
//                 },
//                 () => previousArgs,
//             );
//         }
//
//         aroundAdvice(ctxt, jp, ctorArgs);
//     } else {
//         instanceResolver.resolve(jp(ctorArgs));
//     }
// }
