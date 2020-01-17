import { WeaverProfile } from '../profile';
import { assert, getOrDefault, isArray, isUndefined } from '../../utils';
import { Aspect, JoinPoint } from '../types';
import { WeavingError } from '../weaving-error';
import { AnnotationRef } from '../..';
import { AfterReturnContext, AfterThrowContext, MutableAdviceContext } from '../advices/advice-context';
import {
    Advice,
    AdviceType,
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AroundAdvice,
    BeforeAdvice,
    BeforeClassAdvice,
    CompileAdvice,
} from '../advices/types';
import { AdvicesRegistry } from '../advices/advice-registry';
import { PointcutsRunner, Weaver } from '../weaver';
import { PointcutPhase } from '../advices/pointcut';

type AdvicePipeline = {
    [target in AdviceType]: {
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
            this._aspects = this._aspects.filter(a => !!this._aspectsRegistry[a.id]);

            this._advices = this._aspects.reduce((pipeline: AdvicePipeline, aspect: Aspect) => {
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
                        ).push(advice);
                    });
                return pipeline;
            }, {} as AdvicePipeline);
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

    getAdvices<A extends AdviceType>(
        phase: PointcutPhase.COMPILE,
        ctxt: MutableAdviceContext<A>,
    ): CompileAdvice<any, A>[];
    getAdvices<A extends AdviceType>(
        phase: PointcutPhase.BEFORE,
        ctxt: MutableAdviceContext<A>,
    ): BeforeClassAdvice<any>[];
    getAdvices<A extends AdviceType>(phase: PointcutPhase.AFTER, ctxt: MutableAdviceContext<A>): AfterAdvice<any>[];
    getAdvices<A extends AdviceType>(
        phase: PointcutPhase.AFTERRETURN,
        ctxt: MutableAdviceContext<A>,
    ): AfterReturnAdvice<any>[];
    getAdvices<A extends AdviceType>(
        phase: PointcutPhase.AFTERTHROW,
        ctxt: MutableAdviceContext<A>,
    ): AfterThrowAdvice<any>[];
    getAdvices<A extends AdviceType>(phase: PointcutPhase.AROUND, ctxt: MutableAdviceContext<A>): AroundAdvice<any>[];
    getAdvices<A extends AdviceType>(phase: PointcutPhase, ctxt: MutableAdviceContext<A>): Advice[];
    getAdvices<A extends AdviceType>(phase: PointcutPhase, ctxt: MutableAdviceContext<A>): Advice[] {
        assert(!!this._advices);
        return [..._getAdvicesArray(this._advices, ctxt.annotation.target.type, phase, ctxt.annotation)];
    }

    private _assertNotLoaded(msg: string): void {
        if (this._advices) {
            throw new WeavingError(msg);
        }
    }
}

function _getAdvicesArray(
    pipeline: AdvicePipeline,
    type: AdviceType,
    phase: PointcutPhase,
    annotation: AnnotationRef,
): Advice[] {
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

    private _compileClass<T>(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
        const newCtor = this.weaver
            .getAdvices(PointcutPhase.COMPILE, ctxt)
            .map((advice: CompileAdvice<unknown, AdviceType.CLASS>) => advice(ctxt.freeze()))
            .filter(c => !!c)
            .slice(-1)[0];

        if (newCtor) {
            ctxt.annotation.target.proto.constructor = newCtor;
        }
    }

    private _beforeClass<T>(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.BEFORE);
    }

    private _aroundClass(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
        const proto = ctxt.annotation.target.proto;

        // this partial instance will take place until ctor is called
        const partialThis = Object.create(proto);

        const ctorArgs = ctxt.args;

        const refCtor = Reflect.getOwnMetadata('aspectjs.referenceCtor', ctxt.annotation.target.proto);
        assert(!!refCtor);

        // create ctor joinpoint
        let jp = JoinpointFactory.create(
            (args: any[]) => new refCtor(...args),
            () => ctorArgs,
        );

        const aroundAdvices = this.weaver.getAdvices(PointcutPhase.AROUND, ctxt);
        const originalThis = ctxt.instance;

        if (aroundAdvices.length) {
            const oldJp = jp;
            let aroundAdvice = aroundAdvices.shift();

            let wasRead = false;
            // ensure 'this' instance has not been read before joinpoint gets called.
            jp = JoinpointFactory.create(
                (args: any[]) => {
                    if (wasRead) {
                        throw new Error(
                            `In advice "${aroundAdvice}": Cannot get "this" instance of constructor before calling constructor joinpoint`,
                        );
                    }

                    ctxt.instance = oldJp(args);
                },
                () => ctorArgs,
            );

            let previousArgs = ctorArgs;
            // nest all around advices into each others
            while (aroundAdvices.length) {
                const previousAroundAdvice = aroundAdvice;
                aroundAdvice = aroundAdvices.shift();
                const previousJp = jp;

                // replace args that may have been passed from calling advice's joinpoint
                jp = JoinpointFactory.create(
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

                ctxt.instance = partialThis;
                const { instance, ...frozenContext } = { ...ctxt.freeze() };
                Reflect.defineProperty(frozenContext, 'instance', {
                    get() {
                        wasRead = true;
                        return ctxt.instance;
                    },
                });
                Object.freeze(frozenContext);
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

    private _afterReturnClass(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
        let newInstance = ctxt.instance;

        const advices = this.weaver.getAdvices(PointcutPhase.AFTERRETURN, ctxt);

        while (advices.length) {
            const advice = advices.shift();
            ctxt.value = ctxt.instance;
            newInstance = advice(ctxt.freeze(), ctxt.value);
            if (!isUndefined(newInstance)) {
                ctxt.instance = newInstance;
            }
        }
    }

    private _afterThrowClass(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
        const afterThrowAdvices = this.weaver.getAdvices(PointcutPhase.AFTERTHROW, ctxt);
        if (!afterThrowAdvices.length) {
            // pass-trough errors by default
            throw ctxt.error;
        } else {
            let newInstance = ctxt.instance;

            while (afterThrowAdvices.length) {
                const advice = afterThrowAdvices.shift();
                newInstance = advice(ctxt.freeze());
                if (!isUndefined(newInstance)) {
                    ctxt.instance = newInstance;
                }
            }
        }
    }

    private _afterClass(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTER);
    }

    private _compileProperty(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        const target = ctxt.annotation.target;
        const compileAdvices = this.weaver.getAdvices(PointcutPhase.COMPILE, ctxt);
        let newDescriptor = compileAdvices
            .map((advice: CompileAdvice<unknown, AdviceType.PROPERTY>) => advice(ctxt.freeze()))
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

    private _beforePropertyGet(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _aroundPropertyGet(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        const refDescriptor = Reflect.getOwnMetadata('aspectjs.refDescriptor', ctxt.annotation.target.proto);
        assert(!!refDescriptor);

        const aroundAdvices = this.weaver.getAdvices(PointcutPhase.AROUND, ctxt);

        if (aroundAdvices.length) {
            const refGetter = refDescriptor.get.bind(ctxt.instance);

            // create getter joinpoint
            let jp = JoinpointFactory.create(() => refGetter());

            let aroundAdvice = aroundAdvices.shift();

            // nest all around advices into each others
            while (aroundAdvices.length) {
                const previousAroundAdvice = aroundAdvice;
                aroundAdvice = aroundAdvices.shift();
                const previousJp = jp;

                // replace args that may have been passed from calling advice's joinpoint
                jp = JoinpointFactory.create((...args: any[]) => {
                    ctxt.joinpoint = previousJp;
                    ctxt.joinpointArgs = args;
                    previousAroundAdvice(ctxt.freeze(), previousJp, args);
                });
            }

            ctxt.joinpoint = jp;
            aroundAdvice(ctxt.freeze(), jp, undefined);
        } else {
            return (ctxt.value = refDescriptor.get.bind(ctxt.instance)());
        }
    }

    private _afterReturnPropertyGet(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): any {
        return this._applyAfterReturnAdvice(ctxt, PointcutPhase.AFTERRETURN);
    }

    private _afterThrowPropertyGet(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): any {
        const afterThrowAdvices = this.weaver.getAdvices(PointcutPhase.AFTERTHROW, ctxt);
        if (!afterThrowAdvices.length) {
            // pass-trough errors by default
            throw ctxt.error;
        } else {
            return this._applyAfterReturnAdvice(ctxt, PointcutPhase.AFTERTHROW);
        }
    }

    private _afterPropertyGet(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        this._applyNonReturningAdvice(ctxt, PointcutPhase.AFTER);
    }

    private _beforePropertySet(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _aroundPropertySet(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _afterReturnPropertySet(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _afterThrowPropertySet(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _afterPropertySet(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _compileMethod(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _beforeMethod(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _aroundMethod(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _afterReturnMethod(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _afterThrowMethod(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _afterMethod(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _compileParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _beforeParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _aroundParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _afterReturnParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _afterThrowParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _afterParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _applyNonReturningAdvice(ctxt: MutableAdviceContext<any>, phase: PointcutPhase) {
        const frozenCtxt = ctxt.freeze();
        this.weaver.getAdvices(phase, ctxt).forEach((advice: AfterAdvice<unknown>) => {
            const retVal = advice(frozenCtxt) as any;
            if (!isUndefined(retVal)) {
                throw new WeavingError(`Returning from advice "${advice}" is not supported`);
            }
        });
    }

    private _applyAfterReturnAdvice(ctxt: MutableAdviceContext<AdviceType>, phase: PointcutPhase) {
        ctxt.value = ctxt.value ?? undefined; // force key 'value' to be present
        const frozenCtxt = ctxt.freeze() as AfterReturnContext<any, AdviceType>;

        this.weaver.getAdvices(phase, ctxt).forEach((advice: AfterReturnAdvice<unknown>) => {
            const retVal = advice(frozenCtxt, frozenCtxt.value);
            if (!isUndefined(retVal)) {
                frozenCtxt.value = retVal;
            }
        });

        return frozenCtxt.value;
    }
}

class JoinpointFactory<T> {
    static create(fn: (...args: any[]) => any, argsProvider: () => any[] = () => []): JoinPoint {
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
