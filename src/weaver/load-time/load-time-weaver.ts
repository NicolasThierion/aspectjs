import { WeaverProfile } from '../profile';
import { assert, getOrDefault, isArray, isUndefined } from '../../utils';
import { JoinPoint } from '../types';
import { WeavingError } from '../weaving-error';
import { AnnotationRef, AnnotationType } from '../..';
import { AfterReturnContext, AfterThrowContext, MutableAdviceContext } from '../advices/advice-context';
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
import { PointcutsRunner, Weaver } from '../weaver';
import { PointcutPhase } from '../advices/pointcut';

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
    private _runner = new PointcutsRunnersImpl(this);

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

    load(): PointcutsRunner {
        if (!this._advices) {
            this._advices = Object.values(this._aspectsRegistry)
                .sort(ao => ao.order)
                .map(ao => ao.aspect)
                .reduce((pipeline: AdvicePipeline, aspect: object) => {
                    const advices = AdvicesRegistry.getAdvices(aspect);

                    advices
                        .map((advice: any) => {
                            const bound = advice.bind(aspect);
                            Object.defineProperties(bound, Object.getOwnPropertyDescriptors(advice));
                            return bound;
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
        this._runner = new PointcutsRunnersImpl(this);
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

        return _getAdvicesArray(this._advices, ctxt.target.type, phase, ctxt.annotation, false);
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

class PointcutsRunnersImpl implements PointcutsRunner {
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
        const newCtor = this.weaver
            .getAdvices(PointcutPhase.COMPILE, ctxt)
            .map((advice: CompileAdvice<unknown, AnnotationType.CLASS>) => advice(ctxt.clone()))
            .filter(c => !!c)
            .slice(-1)[0];

        if (newCtor) {
            ctxt.target.proto.constructor = newCtor;
        }
    }

    private _beforeClass<T>(ctxt: MutableAdviceContext<AnnotationType.CLASS>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.BEFORE);
    }

    private _aroundClass(ctxt: MutableAdviceContext<AnnotationType.CLASS>): void {
        const proto = ctxt.target.proto;

        // this partial instance will take place until ctor is called
        const partialThis = Object.create(proto);

        const ctorArgs = ctxt.args;

        const refCtor = Reflect.getOwnMetadata('aspectjs.referenceCtor', ctxt.target.proto);
        assert(!!refCtor);

        // create ctor joinpoint
        let jp = JoinpointFactory.create((...args: any[]) => new refCtor(...args), ctorArgs);

        const aroundAdvices = this.weaver.getAdvices(PointcutPhase.AROUND, ctxt);
        const originalThis = ctxt.instance;

        if (aroundAdvices.length) {
            const oldJp = jp;
            let aroundAdvice = aroundAdvices[0];

            let wasRead = false;
            // ensure 'this' instance has not been read before joinpoint gets called.
            jp = JoinpointFactory.create((...args: any[]) => {
                if (wasRead) {
                    throw new Error(
                        `In advice "${aroundAdvice}": Cannot get "this" instance of constructor before calling constructor joinpoint`,
                    );
                }

                ctxt.instance = oldJp(args);
            }, ctorArgs);

            let previousArgs = ctorArgs;
            // nest all around advices into each others
            for (let i = 1; i < aroundAdvices.length; ++i) {
                const previousAroundAdvice = aroundAdvice;
                aroundAdvice = aroundAdvices[i];
                const previousJp = jp;

                // replace args that may have been passed from calling advice's joinpoint
                jp = JoinpointFactory.create((...args: any[]) => {
                    previousArgs = args ?? previousArgs;
                    ctxt.joinpoint = previousJp;
                    ctxt.args = args;
                    previousAroundAdvice(ctxt.clone(), previousJp, args);
                }, previousArgs);
            }

            try {
                ctxt.joinpoint = jp;
                ctxt.args = ctorArgs;

                ctxt.instance = partialThis;
                const frozenContext = ctxt.clone();
                delete (frozenContext as MutableAdviceContext<any>).instance;
                Reflect.defineProperty(frozenContext, 'instance', {
                    get() {
                        wasRead = true;
                        return ctxt.instance;
                    },
                });
                wasRead = false;
                aroundAdvice(frozenContext, jp, ctorArgs);
            } catch (e) {
                // as of ES6 classes, 'this' is no more available after ctor thrown.
                // replace 'this' with partial this

                ctxt.instance = partialThis;

                throw e;
            }
        } else {
            ctxt.instance = jp(ctorArgs);
        }

        // assign 'this' to the object created by the original ctor at joinpoint;
        Object.assign(originalThis, ctxt.instance);
        ctxt.instance = originalThis;
        // TODO what in case advice returns brand new 'this'?
    }

    private _afterReturnClass(ctxt: MutableAdviceContext<AnnotationType.CLASS>): any {
        let newInstance = ctxt.instance;

        const advices = this.weaver.getAdvices(PointcutPhase.AFTERRETURN, ctxt);
        advices.forEach(advice => {
            ctxt.value = ctxt.instance;
            newInstance = advice(ctxt.clone(), ctxt.value);
            if (!isUndefined(newInstance)) {
                ctxt.instance = newInstance;
            }
        });

        return ctxt.instance;
    }

    private _afterThrowClass(ctxt: MutableAdviceContext<AnnotationType.CLASS>): void {
        const afterThrowAdvices = this.weaver.getAdvices(PointcutPhase.AFTERTHROW, ctxt);
        if (!afterThrowAdvices.length) {
            // pass-trough errors by default
            throw ctxt.error;
        } else {
            let newInstance = ctxt.instance;
            afterThrowAdvices.forEach(advice => {
                newInstance = advice(ctxt.clone(), ctxt.error);
                if (!isUndefined(newInstance)) {
                    ctxt.instance = newInstance;
                }
            });
        }
    }

    private _afterClass(ctxt: MutableAdviceContext<AnnotationType.CLASS>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTER);
    }

    private _compileProperty(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        const target = ctxt.target;
        const compileAdvices = this.weaver.getAdvices(PointcutPhase.COMPILE, ctxt);
        let newDescriptor = compileAdvices
            .map((advice: CompileAdvice<unknown, AnnotationType.PROPERTY>) => advice(ctxt.clone()))
            .filter(c => !!c)
            .slice(-1)[0];

        if (newDescriptor) {
            // test property validity
            newDescriptor = Object.getOwnPropertyDescriptor(
                Object.defineProperty({}, 'surrogate', newDescriptor),
                'surrogate',
            );

            target.proto[target.propertyKey] = newDescriptor;
        }
    }

    private _beforePropertyGet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.BEFORE, _isPropertyGet);
    }

    private _aroundPropertyGet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        const refDescriptor = Reflect.getOwnMetadata('aspectjs.refDescriptor', ctxt.target.proto);
        assert(!!refDescriptor);

        const refGetter = refDescriptor.get.bind(ctxt.instance);

        // create getter joinpoint
        let jp = JoinpointFactory.create(refGetter);

        const aroundAdvices = this.weaver.getAdvices(PointcutPhase.AROUND, ctxt).filter(_isPropertyGet);

        if (aroundAdvices.length) {
            let aroundAdvice = aroundAdvices[0];

            // nest all around advices into each others
            for (let i = 1; i < aroundAdvices.length; ++i) {
                const previousAroundAdvice = aroundAdvice;
                aroundAdvice = aroundAdvices[i];
                const previousJp = jp;

                // replace args that may have been passed from calling advice's joinpoint
                jp = JoinpointFactory.create((...args: any[]) => {
                    ctxt.joinpoint = previousJp;
                    ctxt.args = args;
                    return previousAroundAdvice(ctxt.clone(), previousJp, args);
                });
            }

            ctxt.joinpoint = jp;
            ctxt.args = [];
            return (ctxt.value = aroundAdvice(ctxt.clone(), jp, ctxt.args));
        } else {
            return (ctxt.value = jp.bind(ctxt.instance)(ctxt.args));
        }
    }

    private _afterReturnPropertyGet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): any {
        return this._applyAfterReturnAdvice(ctxt, PointcutPhase.AFTERRETURN, _isPropertyGet);
    }

    private _afterThrowPropertyGet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): any {
        const afterThrowAdvices = this.weaver.getAdvices(PointcutPhase.AFTERTHROW, ctxt).filter(_isPropertyGet);
        if (!afterThrowAdvices.length) {
            // pass-trough errors by default
            throw ctxt.error;
        } else {
            return this._applyAfterThrowAdvice(ctxt, PointcutPhase.AFTERTHROW, _isPropertyGet);
        }
    }

    private _afterPropertyGet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTER, _isPropertyGet);
    }

    private _beforePropertySet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.BEFORE, _isPropertySet);
    }

    private _aroundPropertySet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        const refDescriptor = Reflect.getOwnMetadata('aspectjs.refDescriptor', ctxt.target.proto);
        assert(!!refDescriptor);

        const aroundAdvices = this.weaver.getAdvices(PointcutPhase.AROUND, ctxt).filter(_isPropertySet);

        const refSetter = refDescriptor.set.bind(ctxt.instance);

        // create getter joinpoint
        let jp = JoinpointFactory.create(refSetter, ctxt.args);

        if (aroundAdvices.length) {
            let aroundAdvice = aroundAdvices[0];

            // nest all around advices into each others
            let previousArgs = ctxt.args;

            for (let i = 1; i < aroundAdvices.length; ++i) {
                const previousAroundAdvice = aroundAdvice;
                aroundAdvice = aroundAdvices[i];
                const previousJp = jp;

                // replace args that may have been passed from calling advice's joinpoint
                jp = JoinpointFactory.create((...args: any[]) => {
                    previousArgs = args ?? previousArgs;
                    ctxt.joinpoint = previousJp;
                    ctxt.args = args;
                    return previousAroundAdvice(ctxt.clone(), previousJp, args);
                }, previousArgs);
            }

            ctxt.joinpoint = jp;
            return (ctxt.value = aroundAdvice(ctxt.clone(), jp, ctxt.args));
        } else {
            return (ctxt.value = jp(ctxt.args));
        }
    }

    private _afterReturnPropertySet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): any {
        return this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTERRETURN, _isPropertySet);
    }

    private _afterThrowPropertySet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): any {
        const afterThrowAdvices = this.weaver.getAdvices(PointcutPhase.AFTERTHROW, ctxt).filter(_isPropertySet);
        if (!afterThrowAdvices.length) {
            // pass-trough errors by default
            throw ctxt.error;
        } else {
            this._applyAfterThrowAdvice(ctxt, PointcutPhase.AFTERTHROW, _isPropertySet, true);
        }
    }

    private _afterPropertySet(ctxt: MutableAdviceContext<AnnotationType.PROPERTY>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTER);
    }

    private _compileMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _beforeMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _aroundMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _afterReturnMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _afterThrowMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _afterMethod(ctxt: MutableAdviceContext<AnnotationType.METHOD>): void {
        assert(false, 'not implemented');
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
        let advices = this.weaver.getAdvices(phase, ctxt);
        if (filter) {
            advices = advices.filter(filter);
        }
        if (advices.length) {
            const frozenCtxt = ctxt.clone();
            advices.forEach((advice: AfterAdvice<unknown>) => {
                const retVal = advice(frozenCtxt) as any;
                if (!isUndefined(retVal)) {
                    throw new WeavingError(`Returning from advice "${advice}" is not supported`);
                }
            });
        }
    }

    private _applyAfterReturnAdvice(
        ctxt: MutableAdviceContext<AnnotationType>,
        phase: PointcutPhase,
        filter?: (a: Advice) => boolean,
    ) {
        let advices = this.weaver.getAdvices(phase, ctxt);

        if (filter) {
            advices = advices.filter(filter);
        }

        if (advices.length) {
            ctxt.value = ctxt.value ?? undefined; // force key 'value' to be present
            const frozenCtxt = ctxt.clone() as AfterReturnContext<any, AnnotationType>;

            advices.forEach((advice: AfterReturnAdvice<unknown>) => {
                ctxt.value = advice(frozenCtxt, frozenCtxt.value);
            });
        }

        return ctxt.value;
    }

    private _applyAfterThrowAdvice(
        ctxt: MutableAdviceContext<AnnotationType>,
        phase: PointcutPhase,
        filter?: (a: Advice) => boolean,
        prohibitReturn = false,
    ) {
        let advices = this.weaver.getAdvices(phase, ctxt);

        if (filter) {
            advices = advices.filter(filter);
        }

        if (advices.length) {
            ctxt.value = ctxt.value ?? undefined; // force key 'value' to be present
            const frozenCtxt = ctxt.clone() as AfterThrowContext<any, AnnotationType>;

            advices.forEach((advice: AfterThrowAdvice<unknown>) => {
                ctxt.value = advice(frozenCtxt, frozenCtxt.error);

                if (prohibitReturn && !isUndefined(ctxt.value)) {
                    throw new WeavingError(`Returning from advice "${advice}" is not supported`);
                }
            });
        }

        return ctxt.value;
    }
}

class JoinpointFactory<T> {
    static create(fn: (...args: any[]) => any, defaultArgs: any[] = []): JoinPoint {
        const alreadyCalledFn = (): void => {
            throw new WeavingError(`joinPoint already proceeded`);
        };

        const jp = function(args?: any[]) {
            args = args ?? defaultArgs;
            if (!isArray(args)) {
                throw new TypeError(`Joinpoint arguments expected to be array. Got: ${args}`);
            }
            const jp = fn;
            fn = alreadyCalledFn as any;
            return jp(...args);
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
