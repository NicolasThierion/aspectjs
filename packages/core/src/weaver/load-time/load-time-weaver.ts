import { WeaverProfile } from '../profile';
import { assert, getMetaOrDefault, getOrDefault, isArray, isFunction, isUndefined } from '../../utils';
import { JoinPoint } from '../types';
import { WeavingError } from '../errors/weaving-error';
import {
    AdviceContext,
    AfterReturnContext,
    AfterThrowContext,
    AroundContext,
    MutableAdviceContext,
} from '../advices/advice-context';
import {
    Advice,
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AroundAdvice,
    BeforeClassAdvice,
    CompileAdvice,
} from '../advices/types';
import { AdvicesRegistry } from '../advices/advice-registry';
import { AdviceRunners, Weaver } from '../weaver';
import { PointcutPhase } from '../advices/pointcut';
import { AnnotationBundleRegistry } from '../../annotation/bundle/bundle-factory';
import { ASPECT_OPTIONS_REFLECT_KEY, AspectOptions } from '../advices/aspect';
import { AnnotationRef, AnnotationType } from '../../annotation/annotation.types';
import { AdviceError } from '../errors/advice-error';
import { AspectError } from '../errors/aspect-error';

type AdvicePipeline = {
    [target in AnnotationType]: {
        [phase in PointcutPhase]: {
            byAnnotation: {
                [annotationRef: string]: Advice[];
            };
        };
    };
};

export class LoadTimeWeaver extends WeaverProfile implements Weaver {
    private _advices: AdvicePipeline;
    private _runner = new AdviceRunnersImpl(this);

    constructor(name?: string) {
        super(name);
    }

    enable(...aspects: object[]): this {
        this._assertNotLoaded(`Weaver "${this.name}" already loaded: Cannot enable or disable aspects`);
        return super.enable(...aspects);
    }

    disable(...aspects: object[]): this {
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

    load(): AdviceRunners {
        if (!this._advices) {
            this._advices = Object.values(this._aspectsRegistry)
                .sort((a1: any, a2: any) => {
                    // sort by aspect priority
                    const [o1, o2] = [
                        Reflect.getOwnMetadata(ASPECT_OPTIONS_REFLECT_KEY, a1.constructor),
                        Reflect.getOwnMetadata(ASPECT_OPTIONS_REFLECT_KEY, a2.constructor),
                    ] as AspectOptions[];
                    const [p1, p2] = [o1?.priority ?? 0, o2?.priority ?? 0];

                    return p2 - p1;
                })
                .reduce((pipeline: AdvicePipeline, aspect: object) => {
                    const advices = AdvicesRegistry.getAdvicesForAspect(aspect);

                    advices
                        .map((advice: Advice) => {
                            const bound = advice.bind(aspect);
                            Object.defineProperties(bound, Object.getOwnPropertyDescriptors(advice));
                            return bound as Advice;
                        })
                        .forEach(advice => {
                            _getAdvicesArray(
                                pipeline,
                                advice.pointcut.type,
                                advice.pointcut.phase,
                                advice.pointcut.annotation,
                                true,
                            ).push(advice);
                        });
                    return pipeline;
                }, {} as AdvicePipeline);
        }

        return this._runner;
    }

    reset(): this {
        this._assertNotLoaded(`Weaver "${this.name}" already loaded: Cannot reset change its configuration anymore`);
        this._runner = new AdviceRunnersImpl(this);
        this._advices = undefined;
        return super.reset();
    }

    isLoaded(): boolean {
        return !!this._advices;
    }

    getAdvices<A extends AnnotationType>(
        phase: PointcutPhase.COMPILE,
        ctxt: MutableAdviceContext<A>,
    ): CompileAdvice<any, A>[];
    getAdvices<A extends AnnotationType>(
        phase: PointcutPhase.BEFORE,
        ctxt: MutableAdviceContext<A>,
    ): BeforeClassAdvice<any>[];
    getAdvices<A extends AnnotationType>(phase: PointcutPhase.AFTER, ctxt: MutableAdviceContext<A>): AfterAdvice<any>[];
    getAdvices<A extends AnnotationType>(
        phase: PointcutPhase.AFTERRETURN,
        ctxt: MutableAdviceContext<A>,
    ): AfterReturnAdvice<any>[];
    getAdvices<A extends AnnotationType>(
        phase: PointcutPhase.AFTERTHROW,
        ctxt: MutableAdviceContext<A>,
    ): AfterThrowAdvice<any>[];
    getAdvices<A extends AnnotationType>(
        phase: PointcutPhase.AROUND,
        ctxt: MutableAdviceContext<A>,
    ): AroundAdvice<any>[];
    getAdvices<A extends AnnotationType>(phase: PointcutPhase, ctxt: MutableAdviceContext<A>): Advice[];
    getAdvices<A extends AnnotationType>(phase: PointcutPhase, ctxt: MutableAdviceContext<A>): Advice[] {
        assert(!!this._advices);

        // get all advices that correspond to all the annotations of this context
        const bundle = AnnotationBundleRegistry.of(ctxt.target).at(ctxt.target.location);
        const annotations = bundle.all();

        const annotationKey = annotations.map(a => a.toString()).join(',');
        return [
            ...getMetaOrDefault(`aspectjs.advicesForAnnotations(${phase},${annotationKey})`, ctxt.target.proto, () => {
                return annotations
                    .map(annotation => _getAdvicesArray(this._advices, ctxt.target.type, phase, annotation, false))
                    .flat()
                    .sort((a1: Advice, a2: Advice) => {
                        const [p1, p2] = [a1.pointcut.options.priority, a2.pointcut.options.priority];
                        return !p2 && !p2 ? 0 : p2 - p1;
                    });
            }),
        ];
    }

    private _assertNotLoaded(msg: string): void {
        if (this._advices) {
            throw new WeavingError(msg);
        }
    }
}

function _getAdvicesArray(
    pipeline: AdvicePipeline,
    type: AnnotationType,
    phase: PointcutPhase,
    annotation: AnnotationRef,
    save: boolean,
): Advice[] {
    if (!save) {
        return pipeline[type]?.[phase]?.byAnnotation[_annotationId(annotation)] ?? [];
    } else {
        const targetAdvices = getOrDefault(pipeline, type, () => ({} as any));
        const phaseAdvices = getOrDefault(
            targetAdvices,
            phase,
            () =>
                ({
                    byAnnotation: {},
                } as any),
        );
        return getOrDefault(phaseAdvices.byAnnotation, _annotationId(annotation), () => []);
    }
}
function _annotationId(annotation: AnnotationRef): string {
    return `${annotation.groupId}:${annotation.name}`;
}
class AdviceRunnersImpl implements AdviceRunners {
    class = {
        [PointcutPhase.COMPILE]: this._compileClass.bind(this),
        [PointcutPhase.BEFORE]: this._beforeClass.bind(this),
        [PointcutPhase.AROUND]: this._aroundClass.bind(this),
        [PointcutPhase.AFTERRETURN]: this._afterReturnClass.bind(this),
        [PointcutPhase.AFTERTHROW]: this._afterThrowClass.bind(this),
        [PointcutPhase.AFTER]: this._afterClass.bind(this),
    };
    property = {
        [PointcutPhase.COMPILE]: this._compileProperty.bind(this),
        setter: {
            [PointcutPhase.BEFORE]: this._beforePropertySet.bind(this),
            [PointcutPhase.AROUND]: this._aroundPropertySet.bind(this),
            [PointcutPhase.AFTERRETURN]: this._afterReturnPropertySet.bind(this),
            [PointcutPhase.AFTERTHROW]: this._afterThrowPropertySet.bind(this),
            [PointcutPhase.AFTER]: this._afterPropertySet.bind(this),
        },
        getter: {
            [PointcutPhase.BEFORE]: this._beforePropertyGet.bind(this),
            [PointcutPhase.AROUND]: this._aroundPropertyGet.bind(this),
            [PointcutPhase.AFTERRETURN]: this._afterReturnPropertyGet.bind(this),
            [PointcutPhase.AFTERTHROW]: this._afterThrowPropertyGet.bind(this),
            [PointcutPhase.AFTER]: this._afterPropertyGet.bind(this),
        },
    };
    method = {
        [PointcutPhase.COMPILE]: this._compileMethod.bind(this),
        [PointcutPhase.BEFORE]: this._beforeMethod.bind(this),
        [PointcutPhase.AROUND]: this._aroundMethod.bind(this),
        [PointcutPhase.AFTERRETURN]: this._afterReturnMethod.bind(this),
        [PointcutPhase.AFTERTHROW]: this._afterThrowMethod.bind(this),
        [PointcutPhase.AFTER]: this._afterMethod.bind(this),
    };
    parameter = {
        [PointcutPhase.COMPILE]: this._compileParameter.bind(this),
        [PointcutPhase.BEFORE]: this._beforeParameter.bind(this),
        [PointcutPhase.AROUND]: this._aroundParameter.bind(this),
        [PointcutPhase.AFTERRETURN]: this._afterReturnParameter.bind(this),
        [PointcutPhase.AFTERTHROW]: this._afterThrowParameter.bind(this),
        [PointcutPhase.AFTER]: this._afterParameter.bind(this),
    };

    constructor(private weaver: LoadTimeWeaver) {}

    private _compileClass<T>(ctxt: MutableAdviceContext<AnnotationType.CLASS>): void {
        ctxt.advices = this.weaver.getAdvices(PointcutPhase.COMPILE, ctxt);
        let advice: CompileAdvice<any, AnnotationType.CLASS>;
        while (ctxt.advices.length) {
            advice = ctxt.advices.shift() as CompileAdvice<any, AnnotationType.CLASS>;
            ctxt.target.proto.constructor = advice(ctxt as AdviceContext<any, any>) ?? ctxt.target.proto.constructor;
        }
    }

    private _beforeClass<T>(ctxt: MutableAdviceContext<AnnotationType.CLASS>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.BEFORE);
    }

    private _aroundClass(ctxt: MutableAdviceContext<AnnotationType.CLASS>): void {
        const proto = ctxt.target.proto;

        // this partial instance will take place until ctor is called
        const partialThis = Object.create(proto);

        const refCtor = Reflect.getOwnMetadata('aspectjs.referenceCtor', ctxt.target.proto);
        assert(!!refCtor);

        ctxt.advices = this.weaver.getAdvices(PointcutPhase.AROUND, ctxt);

        // create ctor joinpoint
        const originalJp = JoinpointFactory.create(
            ctxt,
            (...args: any[]) => new refCtor(...args),
            () => ctxtCopy.args,
        );
        const originalThis = ctxt.instance;
        let thisAccess: AroundAdvice<any>;
        let lastAdvice: AroundAdvice<any>;
        // safe ctxt copy with protected this access
        const ctxtCopy: MutableAdviceContext<any> = ctxt.clone();
        delete ctxtCopy.instance;
        Reflect.defineProperty(ctxtCopy, 'instance', {
            get() {
                thisAccess = lastAdvice;
                return ctxt.instance;
            },
        });
        function createNextJoinpoint() {
            return JoinpointFactory.create(
                ctxt,
                (...args: any[]) => {
                    if (ctxtCopy.advices.length) {
                        lastAdvice = ctxtCopy.advices.shift() as AroundAdvice<any>;

                        const nextJp = createNextJoinpoint() as any;
                        ctxtCopy.joinpoint = nextJp;
                        ctxtCopy.args = args;

                        return (ctxt.instance = lastAdvice(ctxtCopy as any, nextJp, args) ?? ctxtCopy.instance);
                    } else {
                        if (thisAccess) {
                            // ensure 'this' instance has not been read before joinpoint gets called.
                            throw new AdviceError(
                                thisAccess,
                                `Cannot get "this" instance of constructor before calling constructor joinpoint`,
                            );
                        }
                        return (ctxt.instance = originalJp(args) ?? ctxt.instance);
                    }
                },
                () => ctxtCopy.args,
            );
        }

        if (ctxtCopy.advices.length) {
            ctxt.instance = partialThis;
            const jp = createNextJoinpoint();
            try {
                ctxt.instance = jp();
            } catch (e) {
                // as of ES6 classes, 'this' is no more available after ctor thrown.
                // replace 'this' with partial this

                ctxt.instance = partialThis;

                throw e;
            }
        } else {
            ctxt.instance = originalJp(ctxt.args);
        }

        // assign 'this' to the object created by the original ctor at joinpoint;
        Object.assign(originalThis, ctxt.instance);
        ctxt.instance = originalThis;

        delete ctxt.joinpoint;
        // TODO what in case advice returns brand new 'this'?
    }

    private _afterReturnClass(ctxt: MutableAdviceContext<AnnotationType.CLASS>): any {
        let newInstance = ctxt.instance;

        ctxt.advices = this.weaver.getAdvices(PointcutPhase.AFTERRETURN, ctxt);
        while (ctxt.advices.length) {
            const advice = ctxt.advices.shift() as AfterReturnAdvice<any>;
            ctxt.value = ctxt.instance;
            newInstance = advice(ctxt as AdviceContext<any, any>, ctxt.value);
            if (!isUndefined(newInstance)) {
                ctxt.instance = newInstance;
            }
        }

        return ctxt.instance;
    }

    private _afterThrowClass(ctxt: MutableAdviceContext<AnnotationType.CLASS>): void {
        ctxt.advices = this.weaver.getAdvices(PointcutPhase.AFTERTHROW, ctxt);
        if (!ctxt.advices.length) {
            // pass-trough errors by default
            throw ctxt.error;
        } else {
            let newInstance = ctxt.instance;
            while (ctxt.advices.length) {
                const advice = ctxt.advices.shift() as AfterThrowAdvice<any>;
                newInstance = advice(ctxt as AdviceContext<any, any>, ctxt.error);
                if (!isUndefined(newInstance)) {
                    ctxt.instance = newInstance;
                }
            }
        }
    }

    private _afterClass(ctxt: MutableAdviceContext<AnnotationType.CLASS>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTER);
    }

    private _compileProperty(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): PropertyDescriptor {
        const target = ctxt.target;
        ctxt.advices = this.weaver.getAdvices(PointcutPhase.COMPILE, ctxt);
        let advice: CompileAdvice<any, AnnotationType.PROPERTY>;
        let newDescriptor: PropertyDescriptor;

        while (ctxt.advices.length) {
            advice = ctxt.advices.shift() as CompileAdvice<any, AnnotationType.PROPERTY>;
            newDescriptor = (advice(ctxt as AdviceContext<any, any>) as PropertyDescriptor) ?? newDescriptor;
        }

        if (newDescriptor) {
            if (Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey)?.configurable === false) {
                throw new AdviceError(advice, `${target.label} is not configurable`);
            }

            // test property validity
            const surrogate = { prop: '' };
            const surrogateProp = Reflect.getOwnPropertyDescriptor(surrogate, 'prop');
            if (isUndefined(newDescriptor.enumerable)) {
                newDescriptor.enumerable = surrogateProp.enumerable;
            }

            if (isUndefined(newDescriptor.configurable)) {
                newDescriptor.configurable = surrogateProp.configurable;
            }

            // normalize the descriptor
            newDescriptor = Object.getOwnPropertyDescriptor(
                Object.defineProperty(surrogate, 'newProp', newDescriptor),
                'newProp',
            );

            Reflect.defineProperty(target.proto, target.propertyKey, newDescriptor);
        }

        return newDescriptor;
    }

    private _beforePropertyGet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.BEFORE, _isPropertyGet);
    }

    private _aroundPropertyGet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        const refDescriptor = Reflect.getOwnMetadata(
            'aspectjs.refDescriptor',
            ctxt.target.proto,
            ctxt.target.propertyKey,
        );
        assert(isFunction(refDescriptor?.get));
        this._applyAroundMethod(ctxt, refDescriptor.get, _isPropertyGet);
        delete ctxt.joinpoint;
    }

    private _afterReturnPropertyGet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): any {
        return this._applyAfterReturnAdvice(ctxt, _isPropertyGet);
    }

    private _afterThrowPropertyGet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): any {
        return this._applyAfterThrowAdvice(ctxt, _isPropertyGet);
    }

    private _afterPropertyGet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTER, _isPropertyGet);
    }

    private _beforePropertySet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.BEFORE, _isPropertySet);
    }

    private _aroundPropertySet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        const refDescriptor = Reflect.getOwnMetadata(
            'aspectjs.refDescriptor',
            ctxt.target.proto,
            ctxt.target.propertyKey,
        );
        assert(isFunction(refDescriptor?.set));
        this._applyAroundMethod(ctxt, refDescriptor.set, _isPropertySet, false);
        delete ctxt.joinpoint;
    }

    private _afterReturnPropertySet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): any {
        return this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTERRETURN, _isPropertySet);
    }

    private _afterThrowPropertySet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): any {
        this._applyAfterThrowAdvice(ctxt, _isPropertySet, true);
    }

    private _afterPropertySet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTER, _isPropertySet);
    }

    private _compileMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): PropertyDescriptor {
        const target = ctxt.target;
        ctxt.advices = this.weaver.getAdvices(PointcutPhase.COMPILE, ctxt);
        let advice: CompileAdvice<any, AnnotationType.METHOD>;
        let newDescriptor: PropertyDescriptor;

        while (ctxt.advices.length) {
            advice = ctxt.advices.shift() as CompileAdvice<any, AnnotationType.METHOD>;
            newDescriptor = (advice(ctxt as AdviceContext<any, any>) as PropertyDescriptor) ?? newDescriptor;
        }

        if (!isUndefined(newDescriptor)) {
            if (Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey)?.configurable === false) {
                throw new AdviceError(advice, `${target.label} is not configurable`);
            }

            // ensure value is a function
            if (!isFunction(newDescriptor.value)) {
                throw new AdviceError(
                    advice,
                    `Expected advice to return a method descriptor. Got: ${newDescriptor.value}`,
                );
            }

            if (isUndefined(newDescriptor.enumerable)) {
                newDescriptor.enumerable = false;
            }
            if (isUndefined(newDescriptor.configurable)) {
                newDescriptor.configurable = true;
            }
            // test property validity
            newDescriptor = Object.getOwnPropertyDescriptor(
                Object.defineProperty({}, 'surrogate', newDescriptor),
                'surrogate',
            );

            Reflect.defineProperty(target.proto, target.propertyKey, newDescriptor);
        }

        return newDescriptor;
    }

    private _beforeMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.BEFORE);
    }

    private _aroundMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): any {
        const refDescriptor = Reflect.getOwnMetadata(
            'aspectjs.refDescriptor',
            ctxt.target.proto,
            ctxt.target.propertyKey,
        );
        assert(isFunction(refDescriptor?.value));
        return this._applyAroundMethod(ctxt, refDescriptor.value);
    }

    private _applyAroundMethod<A extends AnnotationType>(
        ctxt: MutableAdviceContext<A>,
        refMethod: (...args: any[]) => any,
        filter?: (advice: Advice) => boolean,
        allowReturn = true,
    ): any {
        // create method joinpoint
        const originalJp = JoinpointFactory.create(ctxt, refMethod);

        ctxt.advices = this.weaver.getAdvices(PointcutPhase.AROUND, ctxt);
        if (filter) {
            ctxt.advices = ctxt.advices.filter(filter);
        }

        let lastAdvice: AroundAdvice<any>;
        if (ctxt.advices.length) {
            const jp = createNextJoinpoint();
            ctxt.value = jp();
        } else {
            ctxt.value = originalJp(ctxt.args);
        }

        return ctxt.value;

        function createNextJoinpoint() {
            return JoinpointFactory.create(ctxt, (...args: any[]) => {
                if (ctxt.advices.length) {
                    lastAdvice = ctxt.advices.shift() as AroundAdvice<any>;

                    const nextJp = createNextJoinpoint() as any;
                    ctxt.joinpoint = nextJp;
                    ctxt.args = args;

                    ctxt.value = lastAdvice(ctxt as AroundContext<any, any>, nextJp, args);

                    if (ctxt.value !== undefined && !allowReturn) {
                        throw new AdviceError(lastAdvice, `Returning from advice is not supported`);
                    }

                    delete ctxt.joinpoint;
                    return ctxt.value;
                } else {
                    return originalJp(args);
                }
            });
        }
    }

    private _afterReturnMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): any {
        return this._applyAfterReturnAdvice(ctxt);
    }

    private _afterThrowMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): any {
        return this._applyAfterThrowAdvice(ctxt);
    }

    private _afterMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTER);
    }

    private _compileParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _beforeParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _aroundParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _afterReturnParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _afterThrowParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _afterParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _applyNonReturningAdvice(
        ctxt: MutableAdviceContext<any>,
        phase: PointcutPhase,
        filter?: (advice: Advice) => boolean,
    ) {
        ctxt.advices = this.weaver.getAdvices(phase, ctxt);
        if (filter) {
            ctxt.advices = ctxt.advices.filter(filter);
        }
        while (ctxt.advices.length) {
            const advice = ctxt.advices.shift() as AfterAdvice<unknown>;
            const retVal = advice(ctxt as AdviceContext) as any;
            if (!isUndefined(retVal)) {
                throw new AdviceError(advice, `Returning from advice is not supported`);
            }
        }
    }

    private _applyAfterReturnAdvice(ctxt: MutableAdviceContext<AnnotationType>, filter?: (a: Advice) => boolean) {
        ctxt.advices = this.weaver.getAdvices(PointcutPhase.AFTERRETURN, ctxt);

        if (filter) {
            ctxt.advices = ctxt.advices.filter(filter);
        }

        if (ctxt.advices.length) {
            ctxt.value = ctxt.value ?? undefined; // force key 'value' to be present

            while (ctxt.advices.length) {
                const advice = ctxt.advices.shift() as AfterReturnAdvice<any>;
                ctxt.value = advice(ctxt as AfterReturnContext<any, AnnotationType>, ctxt.value);
            }
        }

        return ctxt.value;
    }

    private _applyAfterThrowAdvice(
        ctxt: MutableAdviceContext<AnnotationType>,
        filter?: (a: Advice) => boolean,
        prohibitReturn = false,
    ) {
        ctxt.advices = this.weaver.getAdvices(PointcutPhase.AFTERTHROW, ctxt);

        if (filter) {
            ctxt.advices = ctxt.advices.filter(filter);
        }

        if (ctxt.advices.length) {
            ctxt.value = ctxt.value ?? undefined; // force key 'value' to be present

            while (ctxt.advices.length) {
                const advice = ctxt.advices.shift() as AfterThrowAdvice<unknown>;
                ctxt.value = advice(ctxt as AfterThrowContext<any, AnnotationType>, ctxt.error);

                if (prohibitReturn && !isUndefined(ctxt.value)) {
                    throw new AdviceError(advice, `Returning from advice is not supported`);
                }
            }

            return ctxt.value;
        } else {
            assert(!!ctxt.error);
            // pass-trough errors by default
            throw ctxt.error;
        }
    }

    private _applyOnce(fn: Function, phase: PointcutPhase) {
        return (ctxt: AdviceContext, ...args: any[]) => {
            const key = `aspectjs.isAdviced(${phase})`;
            const applied = Reflect.getOwnMetadata(key, ctxt.target.proto, ctxt.target.propertyKey);
            if (!applied) {
                Reflect.defineMetadata(key, true, ctxt.target.proto, ctxt.target.propertyKey);
                return fn.call(this, ctxt, ...args);
            }
        };
    }
}

class JoinpointFactory<T> {
    static create(
        ctxt: MutableAdviceContext<any>,
        fn: (...args: any[]) => any,
        defaultArgsProvider = () => ctxt.args,
    ): JoinPoint {
        const alreadyCalledFn = (): void => {
            throw new AspectError(ctxt as AdviceContext, `joinPoint already proceeded`);
        };

        const jp = function(args?: any[]) {
            args = args ?? defaultArgsProvider();
            if (!isArray(args)) {
                throw new AspectError(ctxt as AdviceContext, `Joinpoint arguments expected to be array. Got: ${args}`);
            }
            const jp = fn;
            fn = alreadyCalledFn as any;
            return jp.bind(ctxt.instance)(...args);
        };

        return jp;
    }
}

function _isPropertyGet(a: Advice) {
    return a.pointcut.ref.startsWith('property#get');
}

function _isPropertySet(a: Advice) {
    return a.pointcut.ref.startsWith('property#set');
}
