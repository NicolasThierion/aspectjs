import { WeaverProfile } from '../profile';
import { assert, getOrDefault, isArray, isUndefined } from '../../utils';
import { Aspect, JoinPoint } from '../types';
import { WeavingError } from '../weaving-error';
import { AnnotationRef } from '../..';
import { MutableAdviceContext } from '../advices/advice-context';
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

            this._advices = this._aspects
                .map(AdvicesRegistry.getAdvices)
                .flat()
                .reduce((pipeline: AdvicePipeline, advice: Advice) => {
                    _getAdvicesArray(
                        pipeline,
                        advice.pointcut.targetType,
                        advice.pointcut.phase,
                        advice.pointcut.annotation,
                    ).push(advice);
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
    targetType: AdviceType,
    phase: PointcutPhase,
    annotation: AnnotationRef,
): Advice[] {
    const targetAdvices = getOrDefault(pipeline, targetType, () => ({} as any));

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
        compile: this._classCompile.bind(this),
        before: this._classBefore.bind(this),
        around: this._classAround.bind(this),
        afterReturn: this._classAfterReturn.bind(this),
        afterThrow: this._classAfterThrow.bind(this),
        after: this._classAfter.bind(this),
    };
    property = {
        compile: this._propertyCompile.bind(this),
        before: this._propertyBefore.bind(this),
        around: this._propertyAround.bind(this),
        afterReturn: this._propertyAfterReturn.bind(this),
        afterThrow: this._propertyAfterThrow.bind(this),
        after: this._propertyAfter.bind(this),
    };
    method = {
        compile: this._methodCompile.bind(this),
        before: this._methodBefore.bind(this),
        around: this._methodAround.bind(this),
        afterReturn: this._methodAfterReturn.bind(this),
        afterThrow: this._methodAfterThrow.bind(this),
        after: this._methodAfter.bind(this),
    };
    parameter = {
        compile: this._parameterCompile.bind(this),
        before: this._parameterBefore.bind(this),
        around: this._parameterAround.bind(this),
        afterReturn: this._parameterAfterReturn.bind(this),
        afterThrow: this._parameterAfterThrow.bind(this),
        after: this._parameterAfter.bind(this),
    };

    constructor(private weaver: LoadTimeWeaver) {}

    private _classCompile<T>(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
        const newCtor = this.weaver
            .getAdvices(PointcutPhase.COMPILE, ctxt)
            .map((advice: CompileAdvice<unknown, AdviceType.CLASS>) => advice(ctxt.freeze()))
            .filter(c => !!c)
            .slice(-1)[0];

        if (newCtor) {
            ctxt.annotation.target.proto.constructor = newCtor;
        }
    }

    private _classBefore<T>(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
        const frozenCtxt = ctxt.freeze();
        this.weaver.getAdvices(PointcutPhase.BEFORE, ctxt).forEach((advice: BeforeAdvice<unknown>) => {
            const retVal = advice(frozenCtxt) as any;
            if (retVal) {
                throw new WeavingError(`Returning from @Before advice "${advice}" is not supported`);
            }
        });
    }

    private _classAround(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
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

        const aroundAdvices = this.weaver.getAdvices(PointcutPhase.AROUND, ctxt);
        const originalThis = ctxt.instance;

        if (aroundAdvices.length) {
            const oldJp = jp;
            let aroundAdvice = aroundAdvices.shift();

            let wasRead = false;
            // ensure 'this' instance has not been read before joinpoint gets called.
            jp = jpf.create(
                (args: any[]) => {
                    if (wasRead) {
                        throw new Error(
                            `In @Around advice "${aroundAdvice}": Cannot get "this" instance of constructor before calling constructor joinpoint`,
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

    private _classAfterReturn(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
        let newInstance = ctxt.instance;

        const advices = this.weaver.getAdvices(PointcutPhase.AFTERRETURN, ctxt);

        while (advices.length) {
            const advice = advices.shift();
            ctxt.returnValue = ctxt.instance;
            newInstance = advice(ctxt.freeze(), ctxt.returnValue);
            if (!isUndefined(newInstance)) {
                ctxt.instance = newInstance;
            }
        }
    }

    private _classAfterThrow(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
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

    private _classAfter(ctxt: MutableAdviceContext<AdviceType.CLASS>): void {
        this.weaver
            .getAdvices(PointcutPhase.AFTER, ctxt)

            .forEach((advice: AfterAdvice<unknown>) => advice(ctxt.freeze()));
    }

    private _propertyCompile(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        const target = ctxt.annotation.target;
        const newDescriptor = this.weaver
            .getAdvices(PointcutPhase.COMPILE, ctxt)
            .map((advice: CompileAdvice<unknown, AdviceType.PROPERTY>) => advice(ctxt.freeze()))
            .filter(c => !!c)
            .slice(-1)[0];

        if (newDescriptor) {
            target.proto[target.propertyKey] = newDescriptor;
        }
    }

    private _propertyBefore(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _propertyAround(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _propertyAfterReturn(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _propertyAfterThrow(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _propertyAfter(ctxt: MutableAdviceContext<AdviceType.PROPERTY>): void {
        assert(false, 'not implemented');
    }

    private _methodCompile(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _methodBefore(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _methodAround(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _methodAfterReturn(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _methodAfterThrow(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _methodAfter(ctxt: MutableAdviceContext<AdviceType.METHOD>): void {
        assert(false, 'not implemented');
    }

    private _parameterCompile(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _parameterBefore(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _parameterAround(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _parameterAfterReturn(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _parameterAfterThrow(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
        assert(false, 'not implemented');
    }

    private _parameterAfter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
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
