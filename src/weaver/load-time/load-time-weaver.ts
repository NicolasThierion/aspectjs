import { WeaverProfile } from '../profile';
import { assert, getOrDefault, isArray, isUndefined } from '../../utils';
import {
    Advice,
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AroundAdvice,
    Aspect,
    BeforeAdvice,
    JoinPoint,
    MethodPointCutHooks,
    POINTCUT_NAMES,
    SetupAdvice,
} from '../types';
import { WeavingError } from '../weaving-error';
import { AnnotationType, ClassAnnotation, MethodAnnotation, ParameterAnnotation, PropertyAnnotation } from '../..';
import { AnnotationAdviceContext } from '../annotation-advice-context';

type AdviceRegistry = { [k in keyof MethodPointCutHooks]?: Advice<any>[] };

export class Weaver extends WeaverProfile {
    private _advices: AdviceRegistry;
    constructor(name?: string) {
        super(name);
        Object.freeze(this.run);
    }

    run<T>(ctxt: AnnotationAdviceContext<T, AnnotationType>): PointcutRunners<T> {
        return new PointcutRunners(this, ctxt);
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

class PointcutRunners<T> {
    class = {
        setup: () => classSetup(this.weaver, this.ctxt),
        before: () => classBefore(this.weaver, this.ctxt),
        around: () => classAround(this.weaver, this.ctxt),
        afterReturn: () => classAfterReturn(this.weaver, this.ctxt),
        afterThrow: () => classAfterThrow(this.weaver, this.ctxt),
        after: () => classAfter(this.weaver, this.ctxt),
    };
    property = {
        setup: () => propertySetup(this.weaver, this.ctxt),
        before: () => propertyBefore(this.weaver, this.ctxt),
        around: () => propertyAround(this.weaver, this.ctxt),
        afterReturn: () => propertyAfterReturn(this.weaver, this.ctxt),
        afterThrow: () => propertyAfterThrow(this.weaver, this.ctxt),
        after: () => propertyAfter(this.weaver, this.ctxt),
    };
    method = {
        setup: () => methodSetup(this.weaver, this.ctxt),
        before: () => methodBefore(this.weaver, this.ctxt),
        around: () => methodAround(this.weaver, this.ctxt),
        afterReturn: () => methodAfterReturn(this.weaver, this.ctxt),
        afterThrow: () => methodAfterThrow(this.weaver, this.ctxt),
        after: () => methodAfter(this.weaver, this.ctxt),
    };
    parameter = {
        setup: () => parameterSetup(this.weaver, this.ctxt),
        before: () => parameterBefore(this.weaver, this.ctxt),
        around: () => parameterAround(this.weaver, this.ctxt),
        afterReturn: () => parameterAfterReturn(this.weaver, this.ctxt),
        afterThrow: () => parameterAfterThrow(this.weaver, this.ctxt),
        after: () => parameterAfter(this.weaver, this.ctxt),
    };

    constructor(private weaver: Weaver, public readonly ctxt: AnnotationAdviceContext<any, AnnotationType>) {}
}

class JoinpointFactory<T> {
    create(fn: (...args: any[]) => any, argsProvider: () => any[]): JoinPoint {
        const alreadyCalledFn = (): void => {
            throw new WeavingError(`joinPoint already proceeded`);
        };

        const originalArgs = argsProvider();
        const jp = function(args?: any[]) {
            args = args ?? originalArgs;
            if (!isArray(args)) {
                throw new TypeError(`Joinpoint arguments expected to be array. Got: ${args}`);
            }
            const jp = fn;
            fn = alreadyCalledFn as any;
            return jp(args);
        };

        return jp;
    }
}

function classSetup<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ClassAnnotation>): void {
    assert(false, 'not implemented');
}
function classBefore<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ClassAnnotation>): void {
    weaver.getAdvices('before').forEach((advice: BeforeAdvice<unknown>) => advice(ctxt));
}
function classAround<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ClassAnnotation>): void {
    const proto = ctxt.annotation.target.proto;

    // this partial instance will take place until ctor is called
    const partialThis = Object.create(proto);

    const jpf = new JoinpointFactory();

    const ctorArgs = ctxt.args;
    // create ctor joinpoint
    let jp = jpf.create(
        (args: any[]) => new proto.constructor(...args),
        () => ctorArgs,
    );

    const aroundAdvices = weaver.getAdvices('around');
    const originalThis = ctxt.instance.instance();

    if (aroundAdvices.length) {
        // allow call to fake 'this'
        ctxt.instance.resolve(partialThis);
        const oldJp = jp;

        // intercept this call, and ensure it has not been read before joinpoint gets called.
        jp = jpf.create(
            (args: any[]) => {
                if (ctxt.instance.isDirty()) {
                    throw new Error(`Cannot get "this" instance of constructor before joinpoint has been called`);
                }
                ctxt.instance.resolve(oldJp(args));
            },
            () => ctorArgs,
        );

        let aroundAdvice = aroundAdvices.shift();

        let previousArgs = ctorArgs;
        // nest all around advices into each others
        while (aroundAdvices.length) {
            const previousAroundAdvice = aroundAdvice;
            aroundAdvice = aroundAdvices.shift();
            const previousJp = jp;

            // replace args that may have been passed from calling advice's joinpoint
            jp = jpf.create(
                (...args: any[]) => {
                    previousArgs = args ?? previousArgs;
                    previousAroundAdvice(ctxt, previousJp, args);
                },
                () => previousArgs,
            );
        }

        try {
            aroundAdvice(ctxt, jp, ctorArgs);
        } catch (e) {
            // as of ES6 classes, 'this' is no more available after ctor thrown.
            // replace 'this' with partial this

            ctxt.instance.resolve(partialThis);

            throw e;
        }
    } else {
        ctxt.instance.resolve(jp(ctorArgs));
    }

    // assign 'this' to the object created by the original ctor at joinpoint;
    Object.assign(originalThis, ctxt.instance.instance());
    ctxt.instance.resolve(originalThis);
    // TODO what in case advice returns brand new 'this'?
}

function classAfterReturn<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ClassAnnotation>): void {
    let newInstance = ctxt.instance.instance();

    const advices = weaver.getAdvices('afterReturn');

    while (advices.length) {
        const advice = advices.shift();
        newInstance = advice(ctxt, ctxt.instance.instance());
        if (!isUndefined(newInstance)) {
            ctxt.instance.resolve(newInstance);
        }
    }
}
function classAfterThrow<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ClassAnnotation>): void {
    const afterThrowAdvices = weaver.getAdvices('afterThrow');
    if (!afterThrowAdvices.length) {
        // pass-trough errors by default
        throw ctxt.error;
    } else {
        let newInstance = ctxt.instance.instance();

        while (afterThrowAdvices.length) {
            const advice = afterThrowAdvices.shift();
            newInstance = advice(ctxt);
            if (!isUndefined(newInstance)) {
                ctxt.instance.resolve(newInstance);
            }
        }
    }
}

function classAfter<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ClassAnnotation>): void {
    weaver.getAdvices('after').forEach((advice: AfterAdvice<unknown>) => advice(ctxt));
}

function propertySetup<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, PropertyAnnotation>): void {
    assert(false, 'not implemented');
}
function propertyBefore<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, PropertyAnnotation>): void {
    assert(false, 'not implemented');
}
function propertyAround<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, PropertyAnnotation>): void {
    assert(false, 'not implemented');
}
function propertyAfterReturn<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, PropertyAnnotation>): void {
    assert(false, 'not implemented');
}
function propertyAfterThrow<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, PropertyAnnotation>): void {
    assert(false, 'not implemented');
}
function propertyAfter<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, PropertyAnnotation>): void {
    assert(false, 'not implemented');
}

function methodSetup<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, MethodAnnotation>): void {
    assert(false, 'not implemented');
}
function methodBefore<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, MethodAnnotation>): void {
    assert(false, 'not implemented');
}
function methodAround<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, MethodAnnotation>): void {
    assert(false, 'not implemented');
}
function methodAfterReturn<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, MethodAnnotation>): void {
    assert(false, 'not implemented');
}
function methodAfterThrow<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, MethodAnnotation>): void {
    assert(false, 'not implemented');
}
function methodAfter<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, MethodAnnotation>): void {
    assert(false, 'not implemented');
}

function parameterSetup<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
function parameterBefore<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
function parameterAround<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
function parameterAfterReturn<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
function parameterAfterThrow<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
function parameterAfter<T>(weaver: Weaver, ctxt: AnnotationAdviceContext<T, ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
