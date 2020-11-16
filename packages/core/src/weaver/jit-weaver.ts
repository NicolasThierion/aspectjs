import {
    _getReferenceConstructor,
    _setReferenceConstructor,
    assert,
    getOrComputeMetadata,
    isFunction,
    isUndefined,
    Mutable,
} from '@aspectjs/core/utils';
import {
    Advice,
    AdviceContext,
    AdviceType,
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AfterThrowContext,
    AroundAdvice,
    AroundContext,
    BeforeAdvice,
    CompileAdvice,
    MutableAdviceContext,
    WeaverProfile,
    Weaver,
    WeaverContext,
    AspectType,
    WeaverHooks,
    AdviceError,
    JoinpointFactory,
    JoinPoint,
    AdviceTarget,
} from '@aspectjs/core/commons';
import { AdviceExecutionPlanFactory } from './plan.factory';

const _defineProperty = Object.defineProperty;
type MethodPropertyDescriptor = PropertyDescriptor & { value: (...args: any[]) => any };

/**
 * The JitWeaver wires up advices to the corresponding annotations as soon as the annotation gets processed by JS interpreter.
 * @public
 */
export class JitWeaver extends WeaverProfile implements Weaver {
    private _planFactory: AdviceExecutionPlanFactory;
    constructor(private _context: WeaverContext) {
        super();
        this._planFactory = new AdviceExecutionPlanFactory(_context);
    }

    enable(...aspects: (AspectType | WeaverProfile)[]): this {
        aspects.forEach((aspect) => {
            if (aspect instanceof WeaverProfile) {
                this._context.aspects.registry.register(...aspect.getAspects());
            } else {
                this._context.aspects.registry.register(aspect);
            }
        });
        return super.enable(...aspects);
    }

    disable(...aspects: (AspectType | WeaverProfile)[]): this {
        aspects.forEach((aspect) => {
            if (aspect instanceof WeaverProfile) {
                this._context.aspects.registry.remove(...aspect.getAspects());
            } else {
                this._context.aspects.registry.remove(aspect);
            }
        });
        return super.disable(...aspects);
    }

    reset(): this {
        this._planFactory = new AdviceExecutionPlanFactory(this._context);
        return super.reset();
    }

    enhanceClass<T>(ctxt: MutableAdviceContext<T, AdviceType.CLASS>): new () => T {
        const plan = this._planFactory.create(ctxt.target, new ClassWeaverHooks());
        const originalCtor = ctxt.target.proto.constructor;
        const compiledCtor = plan.compile(ctxt);
        const ctorName = compiledCtor.name;

        let ctor = plan.link(ctxt);
        ctor = _setFunctionName(ctor, ctorName, `class ${ctorName}$$enhanced {}`);

        ctor.prototype = ctxt.target.proto;
        ctor.prototype.constructor = ctor;
        _setReferenceConstructor(ctor as any, originalCtor);
        return ctor as any;
    }

    enhanceProperty<T>(ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>): PropertyDescriptor {
        const gettersPlan = this._planFactory.create(ctxt.target, new PropertyGetterWeaverHooks(), {
            name: 'get',
            fn: _isPropertyGet,
        });

        const refDescriptor = gettersPlan.compile(ctxt);
        const settersPlan = this._planFactory.create(ctxt.target, new PropertySetterWeaverHooks(refDescriptor), {
            name: 'set',
            fn: _isPropertySet,
        });

        let newDescriptor = {
            ...refDescriptor,
        };

        newDescriptor.get = gettersPlan.link(ctxt);

        if (_isDescriptorWritable(newDescriptor)) {
            newDescriptor.set = settersPlan.link(ctxt);
            delete newDescriptor.writable;
        } else {
            delete newDescriptor.set;
        }
        // test property validity
        newDescriptor = Object.getOwnPropertyDescriptor(
            Object.defineProperty({}, 'surrogate', newDescriptor),
            'surrogate',
        );

        const target = ctxt.target;
        Reflect.defineProperty(target.proto, target.propertyKey, newDescriptor);

        return newDescriptor;
    }

    enhanceMethod<T>(ctxt: MutableAdviceContext<T, AdviceType.METHOD>): PropertyDescriptor {
        const plan = this._planFactory.create(ctxt.target, new MethodWeaverHooks());

        // invoke compile method or get default descriptor
        const refDescriptor = plan.compile(ctxt);
        assert(!!refDescriptor);

        const newDescriptor: PropertyDescriptor = { ...refDescriptor };

        newDescriptor.value = plan.link(ctxt);

        Reflect.defineProperty(newDescriptor.value, 'name', {
            value: ctxt.target.propertyKey,
        });

        return newDescriptor;
    }

    enhanceParameter<T>(ctxt: MutableAdviceContext<T, AdviceType.METHOD>): void {
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

abstract class GenericWeaverHooks<T, A extends AdviceType> implements WeaverHooks<T, A> {
    after(ctxt: MutableAdviceContext<T, A>, advices: AfterAdvice<T, A>[]): void {
        _applyNonReturningAdvices(ctxt, advices);
    }

    afterReturn(ctxt: MutableAdviceContext<T, A>, advices: AfterReturnAdvice<T, A>[]): T {
        ctxt.value = ctxt.value; // force key 'value' to be present

        advices.forEach((advice) => {
            ctxt.value = advice(ctxt, ctxt.value);
        });

        return ctxt.value as T;
    }

    afterThrow(ctxt: MutableAdviceContext<T, A>, advices: AfterThrowAdvice<T, A>[], allowReturn = true): any {
        if (advices.length) {
            ctxt.value = ctxt.value ?? undefined; // force key 'value' to be present
            advices.forEach((advice: AfterThrowAdvice) => {
                ctxt.value = advice(ctxt as AfterThrowContext<any, AdviceType>, ctxt.error);

                if (!allowReturn && !isUndefined(ctxt.value)) {
                    throw new AdviceError(advice, `Returning from advice is not supported`);
                }
            });
            return ctxt.value;
        } else {
            assert(!!ctxt.error);
            // pass-trough errors by default
            throw ctxt.error;
        }
    }

    around(
        ctxt: MutableAdviceContext<T, A>,
        advices: AroundAdvice<T, A>[],
        jp: JoinPoint<T>,
        allowReturn = true,
    ): JoinPoint<T> {
        advices.reverse().forEach((advice) => {
            const originalJp = jp;
            const nextJp = JoinpointFactory.create(advice, ctxt, (...args: unknown[]) => originalJp(args));
            jp = (args: any[]) => {
                ctxt.joinpoint = nextJp;
                ctxt.args = args;
                ctxt.value = advice(ctxt as any, nextJp, args);
                if (ctxt.value !== undefined && !allowReturn) {
                    throw new AdviceError(advice, `Returning from advice is not supported`);
                }
                return ctxt.value as T;
            };
        });

        return jp;
    }

    before(ctxt: MutableAdviceContext<T, A>, advices: BeforeAdvice<T, A>[]): void {
        _applyNonReturningAdvices(ctxt, advices);
    }

    abstract compile(
        ctxt: MutableAdviceContext<T, A>,
        advices: CompileAdvice<T, AdviceType>[],
    ): A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;

    abstract initialJoinpoint(
        ctxt: MutableAdviceContext<T, A>,
        originalSymbol: A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor,
    ): void;
}

class ClassWeaverHooks<T> extends GenericWeaverHooks<T, AdviceType.CLASS> {
    private originalInstance: T;

    compile(
        ctxt: MutableAdviceContext<T, AdviceType.CLASS>,
        advices: CompileAdvice<T, AdviceType.CLASS>[],
    ): AdviceType.CLASS extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor {
        // if another @Compile advice has been applied
        // replace wrapped ctor by original ctor before it gets wrapped again
        ctxt.target.proto.constructor = _getReferenceConstructor(ctxt.target.proto);

        let ctor: new (...args: any[]) => T;
        advices.forEach((advice: CompileAdvice<T, AdviceType.CLASS>) => {
            ctor = advice(ctxt as AdviceContext<T, AdviceType.CLASS>) as any;
        });
        return (ctxt.target.proto.constructor = ctor ?? ctxt.target.proto.constructor);
    }

    preAround(ctxt: MutableAdviceContext<T, AdviceType.CLASS>) {
        // original ctor invocation will discard any changes done to instance before, so accessing ctxt.instance is forbidden
        this.originalInstance = ctxt.instance;
        ctxt.instance = null;
    }

    around(
        ctxt: Mutable<AroundContext<T, AdviceType.CLASS>>,
        advices: AroundAdvice<T, AdviceType.CLASS>[],
        joinpoint: JoinPoint<T>,
    ): (args?: any[]) => any {
        advices.reverse().forEach((a) => {
            const originalJp = joinpoint;
            const nextJp = JoinpointFactory.create(a, ctxt, (...args: unknown[]) => originalJp(args));
            joinpoint = (args: any[]) => {
                ctxt.joinpoint = nextJp;
                ctxt.args = args;
                return (ctxt.instance = a(ctxt as any, nextJp, args) ?? ctxt.instance);
            };
        });

        return joinpoint;
    }

    initialJoinpoint(ctxt: MutableAdviceContext<T, AdviceType.CLASS>, originalCtor: { new (...args: any[]): T }): void {
        // We need to keep originalInstance as the instance, because of instanceof.
        // Merge the new instance into originalInstance;
        Object.assign(this.originalInstance, new originalCtor(...ctxt.args) ?? this.originalInstance);
        ctxt.instance = this.originalInstance;
    }

    afterReturn<T>(
        ctxt: MutableAdviceContext<T, AdviceType.CLASS>,
        advices: AfterReturnAdvice<T, AdviceType.CLASS>[],
    ): T {
        let newInstance = ctxt.instance;

        advices.forEach((advice) => {
            ctxt.value = ctxt.instance;
            newInstance = advice(ctxt, ctxt.value);
            if (!isUndefined(newInstance)) {
                ctxt.instance = newInstance;
            }
        });

        return ctxt.instance;
    }
    preAfterThrow(ctxt: MutableAdviceContext<T, AdviceType.CLASS>): void {
        // as of ES6 classes, 'this' is no more available after ctor thrown.
        // replace 'this' with partial this
        ctxt.instance = this.originalInstance;
    }

    afterThrow(ctxt: MutableAdviceContext<T, AdviceType.CLASS>, advices: AfterThrowAdvice<T, AdviceType.CLASS>[]): T {
        if (!advices.length) {
            // pass-trough errors by default
            throw ctxt.error;
        } else {
            let newInstance = ctxt.instance;
            advices.forEach((advice) => {
                newInstance = advice(ctxt, ctxt.error);
                if (!isUndefined(newInstance)) {
                    ctxt.instance = newInstance;
                }
            });
            return ctxt.instance;
        }
    }
}

class PropertyGetterWeaverHooks<T> extends GenericWeaverHooks<T, AdviceType.PROPERTY> {
    compile(
        ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>,
        advices: CompileAdvice<T, AdviceType.PROPERTY>[],
    ): AdviceType.PROPERTY extends AdviceType.METHOD
        ? () => T
        : AdviceType.PROPERTY extends AdviceType.CLASS
        ? { new (...args: any[]): T }
        : PropertyDescriptor {
        const target = ctxt.target;

        // if another @Compile advice has been applied
        // replace wrapped descriptor by original descriptor before it gets wrapped again
        (target as Mutable<AdviceTarget>).descriptor = getOrComputeMetadata(
            'aspectjs.originalDescriptor',
            target.proto,
            target.propertyKey,
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
        );

        let advice: CompileAdvice<T, AdviceType.PROPERTY>;
        let newDescriptor: PropertyDescriptor = ctxt.target.descriptor;

        advices.forEach((advice) => {
            newDescriptor = advice(ctxt) ?? newDescriptor;
        });

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

    preBefore(ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>): void {
        ctxt.args = [];
    }
    initialJoinpoint(ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>, originalDescriptor: PropertyDescriptor): void {
        assert(isFunction(originalDescriptor.get));
        ctxt.value = JoinpointFactory.create(null, ctxt, originalDescriptor.get)();
    }
}

class PropertySetterWeaverHooks<T> extends GenericWeaverHooks<T, AdviceType.PROPERTY> {
    constructor(private refDescriptor: PropertyDescriptor) {
        super();
    }

    compile(
        ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>,
    ): AdviceType.PROPERTY extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor {
        return this.refDescriptor;
    }

    initialJoinpoint(ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>, refDescriptor: PropertyDescriptor): void {
        assert(isFunction(refDescriptor?.set));
        ctxt.value = JoinpointFactory.create(null, ctxt, refDescriptor.set)(ctxt.args);
    }

    around(
        ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>,
        advices: AroundAdvice<T, AdviceType.PROPERTY>[],
        jp: JoinPoint<T>,
    ): JoinPoint<T> {
        return super.around(ctxt, advices, jp, false);
    }

    afterReturn(
        ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>,
        advices: AfterReturnAdvice<T, AdviceType.PROPERTY>[],
    ): any {
        return _applyNonReturningAdvices(ctxt, advices);
    }

    afterThrow(
        ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>,
        advices: AfterThrowAdvice<T, AdviceType.PROPERTY>[],
    ): any {
        super.afterThrow(ctxt, advices, false);
    }

    after(ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>, advices: AfterAdvice<T, AdviceType.PROPERTY>[]): void {
        _applyNonReturningAdvices(ctxt, advices);
    }
}

function _isPropertyGet(a: Advice) {
    return a.pointcut.ref.startsWith('property#get');
}

class MethodWeaverHooks<T> extends GenericWeaverHooks<T, AdviceType.METHOD> {
    compile(ctxt: MutableAdviceContext<T, AdviceType.METHOD>, advices: CompileAdvice<T, AdviceType.METHOD>[]) {
        const target = ctxt.target;

        // save & restore original descriptor
        Reflect.defineProperty(
            target.proto,
            target.propertyKey,
            getOrComputeMetadata(
                'aspectjs.originalDescriptor',
                target.proto,
                ctxt.target.propertyKey,
                () => {
                    return { ...Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey) };
                },
                true,
            ),
        );

        let lastCompileAdvice = advices[0];
        let newDescriptor: PropertyDescriptor;

        advices.forEach((advice) => {
            lastCompileAdvice = advice;
            newDescriptor =
                (advice(ctxt as AdviceContext<T, AdviceType.METHOD>) as PropertyDescriptor) ?? newDescriptor;
        });

        if (isUndefined(newDescriptor)) {
            return Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey) as MethodPropertyDescriptor;
        } else {
            if (Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey)?.configurable === false) {
                throw new AdviceError(lastCompileAdvice, `${target.label} is not configurable`);
            }

            // ensure value is a function
            if (!isFunction(newDescriptor.value)) {
                throw new AdviceError(
                    lastCompileAdvice,
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
            return newDescriptor as MethodPropertyDescriptor;
        }
    }
    initialJoinpoint(ctxt: MutableAdviceContext<T, AdviceType.METHOD>, refDescriptor: PropertyDescriptor): void {
        ctxt.value = refDescriptor.value.apply(ctxt.instance, ctxt.args);
    }
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

function _compileParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _beforeParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _aroundParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _afterReturnParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _afterThrowParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _afterParameter(ctxt: MutableAdviceContext<AdviceType.PARAMETER>): void {
    assert(false, 'not implemented');
}

function _applyNonReturningAdvices(ctxt: MutableAdviceContext<any>, advices: Advice[]) {
    advices.forEach((advice: AfterAdvice) => {
        const retVal = advice(ctxt as AdviceContext);
        if (!isUndefined(retVal)) {
            throw new AdviceError(advice, `Returning from advice is not supported`);
        }
    });
}
