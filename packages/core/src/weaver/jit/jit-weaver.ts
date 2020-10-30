import { WeaverProfile } from '../profile';
import { assert, getOrComputeMetadata, isArray, isFunction, isUndefined, Mutable } from '@aspectjs/core/utils';
import { AspectType, JoinPoint } from '../types';
import { WeavingError } from '../errors/weaving-error';
import {
    AdviceContext,
    AfterReturnContext,
    AfterThrowContext,
    AroundContext,
    CompileContext,
    MutableAdviceContext,
} from '../../advice/advice-context';
import {
    Advice,
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AroundAdvice,
    BeforeAdvice,
    CompileAdvice,
} from '../../advice/types';
import { AnnotationType } from '../../annotation/annotation.types';
import { AdviceError } from '../errors/advice-error';
import { AspectError } from '../errors/aspect-error';
import { Weaver } from '../weaver';
import { AdviceExecutionPlanFactory, AroundAdvicePlan } from './plan.factory';
import { AnnotationTarget } from '../../annotation/target/annotation-target';

const _defineProperty = Object.defineProperty;

export class JitWeaver extends WeaverProfile implements Weaver {
    private _planFactory = new AdviceExecutionPlanFactory();
    constructor(name?: string) {
        super(name);
    }

    enable(...aspects: AspectType[]): this {
        this._planFactory.enable(...aspects);
        return super.enable(...aspects);
    }

    disable(...aspects: AspectType[]): this {
        this._planFactory.disable(...aspects);
        return super.disable(...aspects);
    }

    reset(): this {
        this._planFactory = new AdviceExecutionPlanFactory();
        return super.reset();
    }

    enhanceClass<T>(ctxt: MutableAdviceContext<T, AnnotationType.CLASS>): new () => T {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const weaver = this;
        const plan = weaver._planFactory.create(ctxt);

        const originalCtor = _compileClass(ctxt, plan.compileAdvices);
        const ctorName = originalCtor.name;
        let ctor = function (...ctorArgs: any[]): T {
            ctxt.args = ctorArgs;

            try {
                _beforeClass(ctxt, plan.beforeAdvices);
                ctxt.instance = this as T;

                _aroundClass(ctxt, plan.aroundAdvices, originalCtor);

                _afterReturnClass(ctxt, plan.afterReturnAdvices);

                return ctxt.instance;
            } catch (e) {
                // consider WeavingErrors as not recoverable by an aspect
                if (e instanceof WeavingError) {
                    throw e;
                }

                ctxt.error = e;
                _afterThrowClass(ctxt, plan.afterThrowAdvices);
                return ctxt.instance;
            } finally {
                _afterClass(ctxt, plan.afterAdvices);
            }
        };

        ctor = _setFunctionName(ctor, ctorName, `class ${ctorName} {}`);

        ctor.prototype = ctxt.target.proto;
        ctor.prototype.constructor = ctor;

        return ctor as any;
    }

    enhanceProperty<T>(ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>): PropertyDescriptor {
        const target = ctxt.target;
        const plan = this._planFactory.create(ctxt);

        const refDescriptor = _compileProperty(ctxt, plan.compileAdvices);

        let newDescriptor = {
            ...refDescriptor,
        };

        newDescriptor.get = function () {
            try {
                ctxt.args = [];
                ctxt.instance = this;
                _beforePropertyGet(ctxt, plan.beforeAdvices);

                _aroundPropertyGet(ctxt, plan.aroundAdvices, refDescriptor);
                assert(!ctxt.joinpoint);

                return _afterReturnPropertyGet(ctxt, plan.afterReturnAdvices);
            } catch (e) {
                ctxt.error = e;
                return _afterThrowPropertyGet(ctxt, plan.afterThrowAdvices);
            } finally {
                _afterPropertyGet(ctxt, plan.afterAdvices);
            }
        };

        if (_isDescriptorWritable(newDescriptor)) {
            newDescriptor.set = function (...args: any[]) {
                try {
                    ctxt.args = args;
                    ctxt.instance = this;
                    _beforePropertySet(ctxt, plan.beforeAdvices);

                    _aroundPropertySet(ctxt, plan.aroundAdvices, refDescriptor);

                    return _afterReturnPropertySet(ctxt, plan.afterReturnAdvices);
                } catch (e) {
                    ctxt.error = e;
                    return _afterThrowPropertySet(ctxt, plan.afterThrowAdvices);
                } finally {
                    _afterPropertySet(ctxt, plan.afterAdvices);
                }
            };

            delete newDescriptor.writable;
        } else {
            delete newDescriptor.set;
        }
        // test property validity
        newDescriptor = Object.getOwnPropertyDescriptor(
            Object.defineProperty({}, 'surrogate', newDescriptor),
            'surrogate',
        );

        Reflect.defineProperty(target.proto, target.propertyKey, newDescriptor);

        return newDescriptor;
    }

    enhanceMethod<T>(ctxt: MutableAdviceContext<T, AnnotationType.METHOD>): PropertyDescriptor {
        const plan = this._planFactory.create(ctxt);

        // invoke compile method or get default descriptor
        const refDescriptor = _compileMethod(ctxt, plan.compileAdvices);
        assert(!!refDescriptor);

        const newDescriptor: PropertyDescriptor = { ...refDescriptor };
        newDescriptor.value = function (...args: any[]) {
            try {
                ctxt.args = args;
                ctxt.instance = this;
                _beforeMethod(ctxt, plan.beforeAdvices);

                _aroundMethod(ctxt, plan.aroundAdvices, refDescriptor);
                assert(!ctxt.joinpoint);

                return _afterReturnMethod(ctxt, plan.afterReturnAdvices);
            } catch (e) {
                ctxt.error = e;
                return _afterThrowMethod(ctxt, plan.afterThrowAdvices);
            } finally {
                _afterMethod(ctxt, plan.afterAdvices);
            }
        };
        Reflect.defineProperty(newDescriptor.value, 'name', {
            value: ctxt.target.propertyKey,
        });

        return newDescriptor;
    }

    enhanceParameter<T>(ctxt: MutableAdviceContext<T, AnnotationType.METHOD>): void {
        const newDescriptor = this.enhanceMethod(ctxt as any);

        Reflect.defineProperty(ctxt.target.proto, ctxt.target.propertyKey, newDescriptor);

        // To override method descriptor from parameter decorator is not allowed..
        // Return value of parameter decorators is ignored
        // Moreover, Reflect.decorate will overwrite any changes made on proto[propertyKey]
        // We monkey patch Object.defineProperty to prevent this;
        Object.defineProperty = function (o: any, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
            if (o === ctxt.target.proto && p === ctxt.target.propertyKey) {
                // prevent writing back old descriptor
                Object.defineProperty = _defineProperty;
                return newDescriptor;
            }

            return _defineProperty(o, p, attributes);
        };

        return newDescriptor as any;
    }
}

class JoinpointFactory<T> {
    static create<T>(instance: T, context: MutableAdviceContext<T>, fn: (...args: any[]) => any): JoinPoint;
    static create<T>(context: MutableAdviceContext<T>, fn: (...args: any[]) => any): JoinPoint;
    static create<T>(...args: any[]): JoinPoint {
        let fn = args.pop() as (...args: any[]) => any;
        const ctxt = args.pop() as MutableAdviceContext<T>;
        const instance = args.pop() as T;

        function alreadyCalledFn(): void {
            throw new AspectError(ctxt as AdviceContext, `joinPoint already proceeded`);
        }

        return function (args?: any[]) {
            args = args ?? ctxt.args;
            if (!isArray(args)) {
                throw new AspectError(ctxt as AdviceContext, `Joinpoint arguments expected to be array. Got: ${args}`);
            }
            const jp = fn;
            fn = alreadyCalledFn as any;
            return jp.bind(instance ?? ctxt.instance)(...args);
        };
    }
}

function _isPropertyGet(a: Advice) {
    return a.pointcut.ref.startsWith('property#get');
}

function _isPropertySet(a: Advice) {
    return a.pointcut.ref.startsWith('property#set');
}

function _setFunctionName<T, F extends (...args: any[]) => T>(fn: F, name: string, tag?: string): F {
    assert(typeof fn === 'function');

    // const newFn = fn;
    const newFn = new Function('fn', `return function ${name}(...args) { return fn.apply(this, args) };`)(fn);
    !Object.defineProperty(newFn, 'name', {
        value: name,
    });
    tag = tag ?? name;

    Object.defineProperty(newFn, Symbol.toPrimitive, {
        enumerable: false,
        configurable: true,
        value: () => tag,
    });

    return newFn;
}

function _isDescriptorWritable(propDescriptor: PropertyDescriptor) {
    const desc = propDescriptor as Record<string, any>;
    return !desc || (desc.hasOwnProperty('writable') && desc.writable) || isFunction(desc.set);
}

function _compileClass<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.CLASS>,
    advices: CompileAdvice<T, AnnotationType.CLASS>[],
): { new (...args: any[]): T } {
    // if another @Compile advice has been applied
    // replace wrapped ctor by original ctor before it gets wrapped again
    ctxt.target.proto.constructor = getOrComputeMetadata(
        'aspectjs.originalCtor',
        ctxt.target.proto,
        () => ctxt.target.proto.constructor,
    );

    advices = [...advices];
    let advice: CompileAdvice<T, AnnotationType.CLASS>;
    let ctor: Function;
    while (advices.length) {
        advice = advices.shift() as CompileAdvice<T, AnnotationType.CLASS>;
        ctor = advice(ctxt as AdviceContext<T, AnnotationType.CLASS>);
    }

    return (ctxt.target.proto.constructor = ctor ?? ctxt.target.proto.constructor);
}

function _beforeClass<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.CLASS>,
    advices: BeforeAdvice<T, AnnotationType.CLASS>[],
): void {
    _applyNonReturningAdvices(ctxt, [...advices]);
}

function _aroundClass<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.CLASS>,
    aroundPlans: AroundAdvicePlan<T, AnnotationType.CLASS>[],
    originalConstructor: new (...args: any[]) => any,
): void {
    // originalConstructor may create a new instance, but we should keep the original not to mess up with instanceof.
    const originalInstance = ctxt.instance;
    let instance = originalInstance;

    const advices = aroundPlans.map((a) => a.around);

    // Original constructor will create a new instance, no matter the mutations applied on current instance until now.
    // For this reason, accessing ctxt.instance is not allowed before calling original joinpoint.
    // The safeContext is a copy of the context, that will throw an error if joinpoint is called after instance has been used.
    let thisAccess: AroundAdvice<any>;
    const safeContext: MutableAdviceContext<any> = ctxt.clone();
    delete safeContext.instance;
    Reflect.defineProperty(safeContext, 'instance', {
        get() {
            thisAccess = lastAdvice;
            return instance;
        },
    });

    // create the joinpoint for the original ctor
    let joinpoint = JoinpointFactory.create(originalInstance, safeContext, (...args: any[]) => {
        if (thisAccess) {
            // ensure orininal ctor is not called after instance was already accessed
            throw new AdviceError(
                thisAccess,
                `Cannot call constructor joinpoint when AroundContext.instance was already used`,
            );
        }

        return (instance = new originalConstructor(...args));
    });

    advices.reverse().forEach((a) => {
        const nextJp = joinpoint;
        joinpoint = JoinpointFactory.create(ctxt, (...args: any[]) => {
            safeContext.joinpoint = nextJp;
            safeContext.args = args;
            lastAdvice = a;
            return (instance = a(safeContext as any, nextJp, args) ?? instance);
        });
    });

    let lastAdvice: AroundAdvice<any>;

    instance = originalInstance;
    const jp = joinpoint;
    try {
        instance = jp();
    } catch (e) {
        // as of ES6 classes, 'this' is no more available after ctor thrown.
        // replace 'this' with partial this
        instance = originalInstance;
        throw e;
    }

    // We need to keep originalThis as the instance, because of instanceof.
    // Merge the new 'this' into originalThis;
    Object.assign(originalInstance, instance);
    ctxt.instance = originalInstance;

    delete ctxt.joinpoint;
}

function _afterReturnClass<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.CLASS>,
    advices: AfterReturnAdvice<T, AnnotationType.CLASS>[],
): T {
    let newInstance = ctxt.instance;

    advices = [...advices];
    while (advices.length) {
        const advice = advices.shift() as AfterReturnAdvice<any>;
        ctxt.value = ctxt.instance;
        newInstance = advice(ctxt as AdviceContext<any, any>, ctxt.value);
        if (!isUndefined(newInstance)) {
            ctxt.instance = newInstance;
        }
    }

    return ctxt.instance;
}

function _afterThrowClass<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.CLASS>,
    advices: AfterThrowAdvice<T, AnnotationType.CLASS>[],
): void {
    advices = [...advices];
    if (!advices.length) {
        // pass-trough errors by default
        throw ctxt.error;
    } else {
        let newInstance = ctxt.instance;
        while (advices.length) {
            const advice = advices.shift() as AfterThrowAdvice<any>;
            newInstance = advice(ctxt as AdviceContext<any, any>, ctxt.error);
            if (!isUndefined(newInstance)) {
                ctxt.instance = newInstance;
            }
        }
    }
}

function _afterClass<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.CLASS>,
    advices: AfterAdvice<T, AnnotationType.CLASS>[],
): void {
    _applyNonReturningAdvices(ctxt, [...advices]);
}

function _compileProperty<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: CompileAdvice<T, AnnotationType.PROPERTY>[],
): PropertyDescriptor {
    const target = ctxt.target;

    // if another @Compile advice has been applied
    // replace wrapped descriptor by original descriptor before it gets wrapped again
    (target as Mutable<AnnotationTarget<any, any>>).descriptor = getOrComputeMetadata(
        'aspectjs.originalDescriptor',
        target.proto,
        () => {
            return (
                Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey) ?? {
                    configurable: true,
                    enumerable: true,
                    get() {
                        return Reflect.getOwnMetadata(`aspectjs.propValue`, this, target.propertyKey);
                    },
                    set(value: any) {
                        Reflect.defineMetadata(`aspectjs.propValue`, value, this, target.propertyKey);
                    },
                }
            );
        },
        true,
        target.propertyKey,
    );

    advices = [...advices];
    let advice: CompileAdvice<T, AnnotationType.PROPERTY>;
    let newDescriptor: PropertyDescriptor = ctxt.target.descriptor;

    while (advices.length) {
        advice = advices.shift() as CompileAdvice<T, AnnotationType.PROPERTY>;
        newDescriptor = advice(ctxt as CompileContext<T, AnnotationType.PROPERTY>) ?? newDescriptor;
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

    if ((newDescriptor as Record<string, any>).hasOwnProperty('value')) {
        const propValue = newDescriptor.value;
        newDescriptor.get = () => propValue;
        delete newDescriptor.writable;
        delete newDescriptor.value;
    }

    return newDescriptor;
}

function _beforePropertyGet<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: BeforeAdvice<T, AnnotationType.PROPERTY>[],
): void {
    _applyNonReturningAdvices(ctxt, advices.filter(_isPropertyGet));
}

function _aroundPropertyGet<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: AroundAdvicePlan<T, AnnotationType.PROPERTY>[],
    refDescriptor: PropertyDescriptor,
): void {
    assert(isFunction(refDescriptor?.get));
    _applyAroundMethod(ctxt, refDescriptor.get, advices.map((a) => a.around).filter(_isPropertyGet));
    delete ctxt.joinpoint;
}

function _afterReturnPropertyGet<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: AfterReturnAdvice<T, AnnotationType.PROPERTY>[],
): any {
    return _applyAfterReturnAdvices(ctxt, advices.filter(_isPropertyGet));
}

function _afterThrowPropertyGet<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: AfterThrowAdvice<T, AnnotationType.PROPERTY>[],
): any {
    return _applyAfterThrowAdvices(ctxt, advices.filter(_isPropertyGet));
}

function _afterPropertyGet<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: AfterAdvice<T, AnnotationType.PROPERTY>[],
): void {
    _applyNonReturningAdvices(ctxt, advices.filter(_isPropertyGet));
}

function _beforePropertySet<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: BeforeAdvice<T, AnnotationType.PROPERTY>[],
): void {
    _applyNonReturningAdvices(ctxt, advices.filter(_isPropertySet));
}

function _aroundPropertySet<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: AroundAdvicePlan<T, AnnotationType.PROPERTY>[],
    refDescriptor: PropertyDescriptor,
): void {
    assert(isFunction(refDescriptor?.set));
    _applyAroundMethod(ctxt, refDescriptor.set, advices.map((a) => a.around).filter(_isPropertySet), false);
    delete ctxt.joinpoint;
}

function _afterReturnPropertySet<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: AfterReturnAdvice<T, AnnotationType.PROPERTY>[],
): any {
    return _applyNonReturningAdvices(ctxt, advices.filter(_isPropertySet));
}

function _afterThrowPropertySet<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: AfterThrowAdvice<T, AnnotationType.PROPERTY>[],
): any {
    _applyAfterThrowAdvices(ctxt, advices.filter(_isPropertySet), true);
}

function _afterPropertySet<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>,
    advices: AfterAdvice<T, AnnotationType.PROPERTY>[],
): void {
    _applyNonReturningAdvices(ctxt, advices.filter(_isPropertySet));
}

function _compileMethod<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.METHOD>,
    advices: CompileAdvice<T, AnnotationType.METHOD>[],
): PropertyDescriptor {
    const target = ctxt.target;

    // save & restore original descriptor
    Reflect.defineProperty(
        target.proto,
        target.propertyKey,
        getOrComputeMetadata(
            'aspectjs.originalDescriptor',
            target.proto,
            () => {
                return { ...Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey) };
            },
            true,
            ctxt.target.propertyKey,
        ),
    );

    advices = advices;
    let advice: CompileAdvice<T, AnnotationType.METHOD>;
    let newDescriptor: PropertyDescriptor;

    while (advices.length) {
        advice = advices.shift() as CompileAdvice<any, AnnotationType.METHOD>;
        newDescriptor = (advice(ctxt as AdviceContext<any, any>) as PropertyDescriptor) ?? newDescriptor;
    }

    if (isUndefined(newDescriptor)) {
        return Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey);
    } else {
        if (Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey)?.configurable === false) {
            throw new AdviceError(advice, `${target.label} is not configurable`);
        }

        // ensure value is a function
        if (!isFunction(newDescriptor.value)) {
            throw new AdviceError(advice, `Expected advice to return a method descriptor. Got: ${newDescriptor.value}`);
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
        return newDescriptor;
    }
}

function _beforeMethod<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.METHOD>,
    advices: BeforeAdvice<T, AnnotationType.METHOD>[],
): void {
    _applyNonReturningAdvices(ctxt, [...advices]);
}

function _aroundMethod<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.METHOD>,
    advices: AroundAdvicePlan<T>[],
    refDescriptor: PropertyDescriptor,
): any {
    assert(isFunction(refDescriptor?.value));
    return _applyAroundMethod(
        ctxt,
        refDescriptor.value,
        advices.map((a) => a.around),
    );
}

function _applyAroundMethod<A extends AnnotationType>(
    ctxt: MutableAdviceContext<unknown, A>,
    refMethod: (...args: any[]) => any,
    advices: AroundAdvice<any, A>[],
    allowReturn = true,
): any {
    // create method joinpoint
    const originalJp = JoinpointFactory.create(ctxt, refMethod);

    let lastAdvice: AroundAdvice<any>;
    if (advices.length) {
        const jp = createNextJoinpoint();
        ctxt.value = jp();
    } else {
        ctxt.value = originalJp(ctxt.args);
    }

    return ctxt.value;

    function createNextJoinpoint() {
        return JoinpointFactory.create(ctxt, (...args: any[]) => {
            if (advices.length) {
                lastAdvice = advices.shift() as AroundAdvice<any>;

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

function _afterReturnMethod<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.METHOD>,
    advices: AfterReturnAdvice<T, AnnotationType.METHOD>[],
): any {
    return _applyAfterReturnAdvices(ctxt, [...advices]);
}

function _afterThrowMethod<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.METHOD>,
    advices: AfterThrowAdvice<T, AnnotationType.METHOD>[],
): any {
    return _applyAfterThrowAdvices(ctxt, [...advices]);
}

function _afterMethod<T>(
    ctxt: MutableAdviceContext<T, AnnotationType.METHOD>,
    advices: AfterAdvice<T, AnnotationType.METHOD>[],
): void {
    _applyNonReturningAdvices(ctxt, [...advices]);
}

function _compileParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _beforeParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _aroundParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _afterReturnParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _afterThrowParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _afterParameter(ctxt: MutableAdviceContext<AnnotationType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _applyNonReturningAdvices(ctxt: MutableAdviceContext<any>, advices: Advice[]) {
    while (advices.length) {
        const advice = advices.shift() as AfterAdvice;
        const retVal = advice(ctxt as AdviceContext);
        if (!isUndefined(retVal)) {
            throw new AdviceError(advice, `Returning from advice is not supported`);
        }
    }
}

function _applyAfterReturnAdvices<T, A extends AnnotationType>(
    ctxt: MutableAdviceContext<T, A>,
    advices: AfterReturnAdvice<T, A>[],
) {
    if (advices.length) {
        ctxt.value = ctxt.value ?? undefined; // force key 'value' to be present

        while (advices.length) {
            const advice = advices.shift() as AfterReturnAdvice<any>;
            ctxt.value = advice(ctxt as AfterReturnContext<any, AnnotationType>, ctxt.value);
        }
    }

    return ctxt.value;
}

function _applyAfterThrowAdvices<T, A extends AnnotationType>(
    ctxt: MutableAdviceContext<T, A>,
    advices: AfterThrowAdvice<T, A>[],
    prohibitReturn = false,
) {
    if (advices.length) {
        ctxt.value = ctxt.value ?? undefined; // force key 'value' to be present

        while (advices.length) {
            const advice = advices.shift() as AfterThrowAdvice;
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
