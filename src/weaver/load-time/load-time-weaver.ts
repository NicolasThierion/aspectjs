import { WeaverProfile } from '../profile';
import { assert, getOrDefault, isArray, isUndefined } from '../../utils';
import { Aspect, JoinPoint } from '../types';
import { WeavingError } from '../weaving-error';
import {
    Annotation,
    AnnotationRef,
    AnnotationType,
    ClassAnnotation,
    MethodAnnotation,
    ParameterAnnotation,
    PropertyAnnotation,
} from '../..';
import { MutableAdviceContext } from '../advices/advice-context';
import {
    Advice,
    AfterAdvice,
    AfterPointcut,
    AfterReturnAdvice,
    AfterReturnPointcut,
    AfterThrowAdvice,
    AfterThrowPointcut,
    AnnotationAdvice,
    AroundAdvice,
    AroundPointcut,
    BeforeAdvice,
    BeforeClassAdvice,
    BeforePointcut,
    Pointcut,
    PointcutName,
    CompileAdvice,
    CompilePointcut,
} from '../advices/types';
import { AdvicesRegistry } from '../advices/advice-registry';
import { AnnotationTarget } from '../../annotation/target/annotation-target';
import { AnnotationContext } from '../../annotation/context/context';

type AdvicePipeline = {
    annotations: {
        [annotationRef: string]: {
            [k in PointcutName]?: AnnotationAdvice[];
        };
    };
};

export class Weaver extends WeaverProfile {
    private _advices: AdvicePipeline;
    constructor(name?: string) {
        super(name);
        Object.freeze(this.run);
    }
    compile<T>(target: AnnotationContext<T, Annotation>): { compile: any } {
        throw new Error('not implemented');
    }

    run<T>(ctxt: MutableAdviceContext<AnnotationType>): PointcutRunners {
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
        this._aspects = this._aspects.filter(a => !!this._aspectsRegistry[a.name]);

        this._advices = this._aspects
            .map(AdvicesRegistry.getAdvices)
            .flat()
            .reduce(
                (advices: AdvicePipeline, advice: Advice) => {
                    const annotationPointcuts = getOrDefault(
                        advices.annotations,
                        _annotationId(advice.pointcut.annotation),
                        () => {
                            return {} as any;
                        },
                    );

                    getOrDefault(annotationPointcuts, advice.pointcut.name, () => []).push(advice);

                    return advices;
                },
                {
                    annotations: {},
                } as AdvicePipeline,
            );
    }

    reset(): this {
        this._assertNotCompiled(`Weaver "${this.name}" already loaded: Cannot reset change its configuration anymore`);
        return super.reset();
    }
    isLoaded(): boolean {
        return !!this._advices;
    }

    getAdvices(pointcut: CompilePointcut): CompileAdvice<any>[];
    getAdvices(pointcut: BeforePointcut): BeforeClassAdvice<any>[];
    getAdvices(pointcut: AfterPointcut): AfterAdvice<any>[];
    getAdvices(pointcut: AfterReturnPointcut): AfterReturnAdvice<any>[];
    getAdvices(pointcut: AfterThrowPointcut): AfterThrowAdvice<any>[];
    getAdvices(pointcut: AroundPointcut): AroundAdvice<any>[];
    getAdvices(pointcut: Pointcut): Advice[] {
        assert(
            !!pointcut.annotation,
            `No other than annotation pointcut are supported at the moment. Got pointcut: ${pointcut}`,
        );

        const advices = getOrDefault(
            getOrDefault(this._advices.annotations, _annotationId(pointcut.annotation), () => ({})),
            pointcut.name,
            () => [],
        );
        return [...advices];
    }

    private _assertNotCompiled(msg: string) {
        if (this._advices) {
            throw new WeavingError(msg);
        }
    }
}

function _annotationId(annotation: AnnotationRef): string {
    return `${annotation.groupId}:${annotation.name}`;
}

class PointcutRunners {
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

    constructor(private weaver: Weaver, public readonly ctxt: MutableAdviceContext<AnnotationType>) {}
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

function classSetup<T>(weaver: Weaver, ctxt: MutableAdviceContext<ClassAnnotation>): void {
    assert(false, 'not implemented');
}
function classBefore<T>(weaver: Weaver, ctxt: MutableAdviceContext<ClassAnnotation>): void {
    weaver
        .getAdvices({
            annotation: ctxt.annotation,
            name: PointcutName.BEFORE,
        })
        .forEach((advice: BeforeAdvice<unknown>) => advice(ctxt.freeze()));
}
function classAround(weaver: Weaver, ctxt: MutableAdviceContext<ClassAnnotation>): void {
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

    const aroundAdvices = weaver.getAdvices({
        annotation: ctxt.annotation,
        name: PointcutName.AROUND,
    });
    const originalThis = ctxt.instance.get();

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
                    ctxt.joinpoint = previousJp;
                    ctxt.joinpointArgs = args;
                    previousAroundAdvice(ctxt.freeze(), previousJp, args);
                },
                () => previousArgs,
            );
        }

        try {
            ctxt.joinpoint = jp;
            ctxt.joinpointArgs = ctorArgs;
            aroundAdvice(ctxt.freeze(), jp, ctorArgs);
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
    Object.assign(originalThis, ctxt.instance.get());
    ctxt.instance.resolve(originalThis);
    // TODO what in case advice returns brand new 'this'?
}

function classAfterReturn(weaver: Weaver, ctxt: MutableAdviceContext<ClassAnnotation>): void {
    let newInstance = ctxt.instance.get();

    const advices = weaver.getAdvices({
        annotation: ctxt.annotation,
        name: PointcutName.AFTERRETURN,
    });

    while (advices.length) {
        const advice = advices.shift();
        ctxt.returnValue = ctxt.instance.get();
        newInstance = advice(ctxt.freeze(), ctxt.returnValue);
        if (!isUndefined(newInstance)) {
            ctxt.instance.resolve(newInstance);
        }
    }
}
function classAfterThrow(weaver: Weaver, ctxt: MutableAdviceContext<ClassAnnotation>): void {
    const afterThrowAdvices = weaver.getAdvices({
        annotation: ctxt.annotation,
        name: PointcutName.AFTERTHROW,
    });
    if (!afterThrowAdvices.length) {
        // pass-trough errors by default
        throw ctxt.error;
    } else {
        let newInstance = ctxt.instance.get();

        while (afterThrowAdvices.length) {
            const advice = afterThrowAdvices.shift();
            newInstance = advice(ctxt.freeze());
            if (!isUndefined(newInstance)) {
                ctxt.instance.resolve(newInstance);
            }
        }
    }
}

function classAfter(weaver: Weaver, ctxt: MutableAdviceContext<ClassAnnotation>): void {
    weaver
        .getAdvices({
            annotation: ctxt.annotation,
            name: PointcutName.AFTER,
        })
        .forEach((advice: AfterAdvice<unknown>) => advice(ctxt.freeze()));
}

function propertySetup(weaver: Weaver, ctxt: MutableAdviceContext<PropertyAnnotation>): void {
    assert(false, 'not implemented');
}
function propertyBefore(weaver: Weaver, ctxt: MutableAdviceContext<PropertyAnnotation>): void {
    assert(false, 'not implemented');
}
function propertyAround(weaver: Weaver, ctxt: MutableAdviceContext<PropertyAnnotation>): void {
    assert(false, 'not implemented');
}
function propertyAfterReturn(weaver: Weaver, ctxt: MutableAdviceContext<PropertyAnnotation>): void {
    assert(false, 'not implemented');
}
function propertyAfterThrow(weaver: Weaver, ctxt: MutableAdviceContext<PropertyAnnotation>): void {
    assert(false, 'not implemented');
}
function propertyAfter(weaver: Weaver, ctxt: MutableAdviceContext<PropertyAnnotation>): void {
    assert(false, 'not implemented');
}

function methodSetup(weaver: Weaver, ctxt: MutableAdviceContext<MethodAnnotation>): void {
    assert(false, 'not implemented');
}
function methodBefore(weaver: Weaver, ctxt: MutableAdviceContext<MethodAnnotation>): void {
    assert(false, 'not implemented');
}
function methodAround(weaver: Weaver, ctxt: MutableAdviceContext<MethodAnnotation>): void {
    assert(false, 'not implemented');
}
function methodAfterReturn(weaver: Weaver, ctxt: MutableAdviceContext<MethodAnnotation>): void {
    assert(false, 'not implemented');
}
function methodAfterThrow(weaver: Weaver, ctxt: MutableAdviceContext<MethodAnnotation>): void {
    assert(false, 'not implemented');
}
function methodAfter(weaver: Weaver, ctxt: MutableAdviceContext<MethodAnnotation>): void {
    assert(false, 'not implemented');
}

function parameterSetup(weaver: Weaver, ctxt: MutableAdviceContext<ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
function parameterBefore(weaver: Weaver, ctxt: MutableAdviceContext<ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
function parameterAround(weaver: Weaver, ctxt: MutableAdviceContext<ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
function parameterAfterReturn(weaver: Weaver, ctxt: MutableAdviceContext<ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
function parameterAfterThrow(weaver: Weaver, ctxt: MutableAdviceContext<ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
function parameterAfter(weaver: Weaver, ctxt: MutableAdviceContext<ParameterAnnotation>): void {
    assert(false, 'not implemented');
}
