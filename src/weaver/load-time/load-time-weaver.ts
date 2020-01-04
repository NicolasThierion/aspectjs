import { WeaverProfile } from '../profile';
import { assert, getOrDefault, isArray, isUndefined } from '../../utils';
import { Aspect, JoinPoint } from '../types';
import { WeavingError } from '../weaving-error';
import {
    Annotation,
    AnnotationRef,
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
import { Weaver, PointcutsRunner } from '../weaver';

type AdvicePipeline = {
    annotations: {
        [annotationRef: string]: {
            [k in PointcutName]?: AnnotationAdvice[];
        };
    };
};

export class LoadTimeWeaver extends WeaverProfile implements Weaver {
    private _advices: AdvicePipeline;
    private _runner = new PointcutsRunnersImpl(this);

    constructor(name?: string) {
        super(name);
    }

    enable(...aspects: Aspect[]): this {
        this._assertNotLoaded(`Weaver "${this.name}" already loaded: Cannot enable or disable aspects`);
        return super.enable(...aspects);
    }
    disable(...aspects: Aspect[]): this {
        this._assertNotLoaded(`Weaver "${this.name}" already loaded: Cannot enable or disable aspects`);
        return super.disable(...aspects);
    }
    merge(...profiles: WeaverProfile[]): this {
        this._assertNotLoaded(`Weaver "${this.name}" already loaded: Cannot change profile`);
        return super.merge(...profiles);
    }
    setProfile(profile: WeaverProfile): this {
        this._assertNotLoaded(`Weaver "${this.name}" already loaded: Cannot change profile`);
        return super.reset().merge(profile);
    }

    load(): PointcutsRunner {
        if (!this._advices) {
            console.debug('weaver is loading...');
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
            console.debug('weaver loaded. You can now use aspects.');
        }

        return this._runner;
    }

    reset(): this {
        this._assertNotLoaded(`Weaver "${this.name}" already loaded: Cannot reset change its configuration anymore`);
        this._runner = undefined;
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

    private _assertNotLoaded(msg: string) {
        if (this._advices) {
            throw new WeavingError(msg);
        }
    }
}

function _annotationId(annotation: AnnotationRef): string {
    return `${annotation.groupId}:${annotation.name}`;
}

class PointcutsRunnersImpl implements PointcutsRunner {
    class = {
        compile: this._classSetup.bind(this),
        before: this._classBefore.bind(this),
        around: this._classAround.bind(this),
        afterReturn: this._classAfterReturn.bind(this),
        afterThrow: this._classAfterThrow.bind(this),
        after: this._classAfter.bind(this),
    };
    property = {
        compile: this._propertySetup.bind(this),
        before: this._propertyBefore.bind(this),
        around: this._propertyAround.bind(this),
        afterReturn: this._propertyAfterReturn.bind(this),
        afterThrow: this._propertyAfterThrow.bind(this),
        after: this._propertyAfter.bind(this),
    };
    method = {
        compile: this._methodSetup.bind(this),
        before: this._methodBefore.bind(this),
        around: this._methodAround.bind(this),
        afterReturn: this._methodAfterReturn.bind(this),
        afterThrow: this._methodAfterThrow.bind(this),
        after: this._methodAfter.bind(this),
    };
    parameter = {
        compile: this._parameterSetup.bind(this),
        before: this._parameterBefore.bind(this),
        around: this._parameterAround.bind(this),
        afterReturn: this._parameterAfterReturn.bind(this),
        afterThrow: this._parameterAfterThrow.bind(this),
        after: this._parameterAfter.bind(this),
    };

    constructor(private weaver: LoadTimeWeaver) {}

    private _classSetup<T>(ctxt: MutableAdviceContext<ClassAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _classBefore<T>(ctxt: MutableAdviceContext<ClassAnnotation>): void {
        this.weaver
            .getAdvices({
                annotation: ctxt.annotation,
                name: PointcutName.BEFORE,
            })
            .forEach((advice: BeforeAdvice<unknown>) => advice(ctxt.freeze()));
    }
    private _classAround(ctxt: MutableAdviceContext<ClassAnnotation>): void {
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

        const aroundAdvices = this.weaver.getAdvices({
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

    private _classAfterReturn(ctxt: MutableAdviceContext<ClassAnnotation>): void {
        let newInstance = ctxt.instance.get();

        const advices = this.weaver.getAdvices({
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
    private _classAfterThrow(ctxt: MutableAdviceContext<ClassAnnotation>): void {
        const afterThrowAdvices = this.weaver.getAdvices({
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

    private _classAfter(ctxt: MutableAdviceContext<ClassAnnotation>): void {
        this.weaver
            .getAdvices({
                annotation: ctxt.annotation,
                name: PointcutName.AFTER,
            })
            .forEach((advice: AfterAdvice<unknown>) => advice(ctxt.freeze()));
    }

    private _propertySetup(ctxt: MutableAdviceContext<PropertyAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _propertyBefore(ctxt: MutableAdviceContext<PropertyAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _propertyAround(ctxt: MutableAdviceContext<PropertyAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _propertyAfterReturn(ctxt: MutableAdviceContext<PropertyAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _propertyAfterThrow(ctxt: MutableAdviceContext<PropertyAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _propertyAfter(ctxt: MutableAdviceContext<PropertyAnnotation>): void {
        assert(false, 'not implemented');
    }

    private _methodSetup(ctxt: MutableAdviceContext<MethodAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _methodBefore(ctxt: MutableAdviceContext<MethodAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _methodAround(ctxt: MutableAdviceContext<MethodAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _methodAfterReturn(ctxt: MutableAdviceContext<MethodAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _methodAfterThrow(ctxt: MutableAdviceContext<MethodAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _methodAfter(ctxt: MutableAdviceContext<MethodAnnotation>): void {
        assert(false, 'not implemented');
    }

    private _parameterSetup(ctxt: MutableAdviceContext<ParameterAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _parameterBefore(ctxt: MutableAdviceContext<ParameterAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _parameterAround(ctxt: MutableAdviceContext<ParameterAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _parameterAfterReturn(ctxt: MutableAdviceContext<ParameterAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _parameterAfterThrow(ctxt: MutableAdviceContext<ParameterAnnotation>): void {
        assert(false, 'not implemented');
    }
    private _parameterAfter(ctxt: MutableAdviceContext<ParameterAnnotation>): void {
        assert(false, 'not implemented');
    }
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
