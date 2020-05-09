import {
    Annotation,
    AnnotationRef,
    AnnotationType,
    ClassAnnotationStub,
    MethodAnnotationStub,
    ParameterAnnotationStub,
    PropertyAnnotationStub,
} from '../annotation.types';
import { WeavingError } from '../../weaver/errors/weaving-error';
import { AdviceRunners, getWeaver } from '../../weaver/weaver';
import { assert, getMetaOrDefault, getProto, isFunction, Mutable } from '../../utils';
import { AnnotationContext } from '../context/context';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { AnnotationTarget } from '../target/annotation-target';
import { AnnotationBundleRegistry } from '../bundle/bundle-factory';
import { MutableAdviceContext } from '../../weaver/advices/advice-context';
import { PointcutPhase } from '../../weaver/advices/pointcut';
import { AnnotationsBundle } from '../bundle/bundle';
import { JoinPoint } from '../../weaver/types';
import { Advice } from '../../weaver/advices/types';

type Decorator = ClassDecorator | MethodDecorator | PropertyDecorator | ParameterDecorator;

let generatedId = 0;
/**
 * Factory to create some {@link Annotation}.
 */
export class AnnotationFactory {
    private readonly _groupId: string;
    constructor(groupId: string) {
        this._groupId = groupId;
    }
    create<A extends ClassAnnotationStub>(annotationStub: A): A & AnnotationRef;
    create<A extends MethodAnnotationStub>(annotationStub: A): A & AnnotationRef;
    create<A extends PropertyAnnotationStub>(annotationStub: A): A & AnnotationRef;
    create<A extends ParameterAnnotationStub>(annotationStub: A): A & AnnotationRef;

    create<S extends Annotation<AnnotationType>>(annotationStub: S): S & AnnotationRef {
        if (!annotationStub.name) {
            Reflect.defineProperty(annotationStub, 'name', {
                value: `anonymousAnnotation#${generatedId++}`,
            });
        }
        const groupId = this._groupId;

        // create the annotation (ie: decorator provider)
        const annotation = function(...annotationArgs: any[]): Decorator {
            const decorator = _createDecorator(annotation as any, annotationArgs);
            _createAnnotationRef(decorator, annotationStub, groupId);

            return decorator;
        };

        return _createAnnotationRef(annotation, annotationStub, groupId);
    }

    static getBundle<T>(target: (new () => T) | T): AnnotationsBundle<any> {
        const proto = getProto(target);
        return AnnotationBundleRegistry.of(
            AnnotationTargetFactory.create({
                proto,
                type: AnnotationType.CLASS,
            }),
        );
    }
}

function _createAnnotationRef<A extends Annotation<AnnotationType>, D extends Decorator>(
    fn: Function & D,
    annotationStub: A,
    groupId: string,
): AnnotationRef & A {
    assert(typeof fn === 'function');

    const annotation = (fn as any) as AnnotationRef & A;
    Object.defineProperties(annotation, Object.getOwnPropertyDescriptors(annotationStub));
    annotation.groupId = groupId;
    Reflect.defineProperty(annotation, 'toString', {
        enumerable: false,
        value: function() {
            return `@${annotation.groupId}:${annotation.name}`;
        },
    });

    Reflect.defineProperty(annotation, Symbol.toPrimitive, {
        enumerable: false,
        value: function() {
            return `@${annotation.name}`;
        },
    });

    getMetaOrDefault('aspectjs.referenceAnnotation', annotationStub, () => {
        Reflect.defineMetadata('aspectjs.referenceAnnotation', annotationStub, fn);
        return annotationStub;
    });

    return annotation;
}

function _setFunctionName(fn: Function, name: string, tag?: string): void {
    assert(typeof fn === 'function');

    Object.defineProperty(fn, 'name', {
        value: name,
    });
    tag = tag ?? name;

    Object.defineProperty(fn, Symbol.toPrimitive, {
        enumerable: false,
        configurable: true,
        value: () => tag,
    });
}

function _createDecorator<A extends AnnotationType>(annotation: Annotation<A>, annotationArgs: any[]): Decorator {
    const GENERATORS = {
        [AnnotationType.CLASS]: _createClassDecoration,
        [AnnotationType.PROPERTY]: _createPropertyDecoration,
        [AnnotationType.METHOD]: _createMethodDecoration,
        [AnnotationType.PARAMETER]: _createParameterDecoration,
    };

    return function(...targetArgs: any[]): Function | PropertyDescriptor | void {
        // assert the weaver is loaded before invoking the underlying decorator
        const weaver = getWeaver();

        if (!weaver) {
            throw new Error(`Cannot invoke annotation ${annotation.name ?? ''} before "setWeaver()" has been called`);
        }

        const target = AnnotationTargetFactory.of(targetArgs) as AnnotationTarget<any, A>;

        const annotationContext = new AnnotationContextImpl(target, annotationArgs, annotation);
        AnnotationBundleRegistry.addContext(target, annotationContext);

        const ctxt = new AdviceContextImpl(annotationContext);

        const generator = GENERATORS[ctxt.target.type];
        return generator(ctxt as AdviceContextImpl<any, any>, weaver.load());
    };
}

class AdviceContextImpl<T, A extends AnnotationType> implements MutableAdviceContext<A> {
    public error?: Error;
    public instance?: T;
    public value?: T | unknown;
    public args?: any[];
    public joinpoint?: JoinPoint;
    public target: AnnotationTarget<T, A>;
    public data: Record<string, any>;
    public advices: Advice[];

    constructor(public annotation: AnnotationContext<T, A>) {
        this.target = annotation.target;
        this.data = {};
    }

    clone(): this {
        return Object.assign(Object.create(Reflect.getPrototypeOf(this)) as MutableAdviceContext<A>, this);
    }

    toString(): string {
        return `${this.annotation} ${this.target}`;
    }
}

class AnnotationContextImpl<T, D extends AnnotationType> implements AnnotationContext<T, D> {
    public readonly name: string;
    public readonly groupId: string;
    private readonly _annotation: AnnotationRef;

    constructor(
        public readonly target: AnnotationTarget<T, D>,
        public readonly args: any[],
        annotation: AnnotationRef,
    ) {
        this.name = annotation.name;
        this.groupId = annotation.groupId;
        this._annotation = annotation;
    }

    toString(): string {
        return this._annotation.toString();
    }
}

function _createClassDecoration<T>(
    ctxt: AdviceContextImpl<any, AnnotationType.CLASS>,
    runner: AdviceRunners,
): Function {
    // if another @Compile advice has been applied
    // replace wrapped ctor by original ctor before it gets wrapped again
    ctxt.target.proto.constructor = getMetaOrDefault(
        'aspectjs.originalCtor',
        ctxt.target.proto,
        () => ctxt.target.proto.constructor,
    );

    runner.class[PointcutPhase.COMPILE](ctxt);
    const ctorName = ctxt.target.proto.constructor.name;

    const ctor = function(...ctorArgs: any[]): T {
        ctxt.args = ctorArgs;

        try {
            runner.class[PointcutPhase.BEFORE](ctxt);
            ctxt.instance = this;

            runner.class[PointcutPhase.AROUND](ctxt);

            runner.class[PointcutPhase.AFTERRETURN](ctxt);

            return ctxt.instance;
        } catch (e) {
            // consider WeavingErrors as not recoverable by an aspect
            if (e instanceof WeavingError) {
                throw e;
            }

            ctxt.error = e;
            runner.class[PointcutPhase.AFTERTHROW](ctxt);
            return ctxt.instance;
        } finally {
            runner.class[PointcutPhase.AFTER](ctxt);
        }
    };

    _setFunctionName(ctor, ctorName, `class ${ctorName} {}`);

    Reflect.defineMetadata('aspectjs.referenceProto', ctor.prototype, ctxt.target.proto);
    Reflect.defineMetadata('aspectjs.referenceCtor', ctxt.target.proto.constructor, ctxt.target.proto);
    ctor.prototype = ctxt.target.proto;
    ctor.prototype.constructor = ctor;

    return ctor;
}

function _createPropertyDecoration(
    ctxt: AdviceContextImpl<any, AnnotationType.PROPERTY>,
    runner: AdviceRunners,
): PropertyDescriptor {
    const target = ctxt.target;

    // if another @Compile advice has been applied
    // replace wrapped descriptor by original descriptor before it gets wrapped again
    (ctxt.target as Mutable<AnnotationTarget<any, any>>).descriptor = getMetaOrDefault(
        'aspectjs.originalDescriptor',
        ctxt.target.proto,
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
        ctxt.target.propertyKey,
    );
    const refDescriptor = { ...(runner.property[PointcutPhase.COMPILE](ctxt) ?? ctxt.target.descriptor) };

    if ((refDescriptor as Record<string, any>).hasOwnProperty('value')) {
        const propValue = refDescriptor.value;
        refDescriptor.get = () => propValue;
        delete refDescriptor.writable;
        delete refDescriptor.value;
    }
    Reflect.defineMetadata('aspectjs.refDescriptor', refDescriptor, target.proto, ctxt.target.propertyKey);

    let newDescriptor = {
        ...refDescriptor,
    };
    newDescriptor.get = function() {
        ctxt.args = [];
        const r = runner.property.getter;
        try {
            ctxt.instance = this;
            r[PointcutPhase.BEFORE](ctxt);

            r[PointcutPhase.AROUND](ctxt);
            assert(!ctxt.joinpoint);

            return r[PointcutPhase.AFTERRETURN](ctxt);
        } catch (e) {
            ctxt.error = e;
            return r[PointcutPhase.AFTERTHROW](ctxt);
        } finally {
            r[PointcutPhase.AFTER](ctxt);
        }
    };

    if (_isWritable(newDescriptor)) {
        newDescriptor.set = function(...args: any[]) {
            const r = runner.property.setter;
            try {
                ctxt.args = args;
                ctxt.instance = this;
                r[PointcutPhase.BEFORE](ctxt);

                r[PointcutPhase.AROUND](ctxt);

                return r[PointcutPhase.AFTERRETURN](ctxt);
            } catch (e) {
                ctxt.error = e;
                return r[PointcutPhase.AFTERTHROW](ctxt);
            } finally {
                r[PointcutPhase.AFTER](ctxt);
            }
        };

        delete newDescriptor.writable;
    } else {
        delete newDescriptor.set;
    }
    // test property validity
    newDescriptor = Object.getOwnPropertyDescriptor(Object.defineProperty({}, 'surrogate', newDescriptor), 'surrogate');

    Reflect.defineProperty(target.proto, target.propertyKey, newDescriptor);

    return newDescriptor;

    function _isWritable(propDescriptor: PropertyDescriptor) {
        const desc = propDescriptor as Record<string, any>;
        return !desc || (desc.hasOwnProperty('writable') && desc.writable) || isFunction(desc.set);
    }
}

function _createMethodDecoration(
    ctxt: AdviceContextImpl<any, AnnotationType.METHOD>,
    runner: AdviceRunners,
): PropertyDescriptor {
    const target = ctxt.target;
    Reflect.defineProperty(
        target.proto,
        target.propertyKey,
        getMetaOrDefault(
            'aspectjs.originalDescriptor',
            target.proto,
            () => {
                return { ...Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey) };
            },
            true,
            ctxt.target.propertyKey,
        ),
    );

    // invoke compile method or get default descriptor
    const refDescriptor =
        runner.method[PointcutPhase.COMPILE](ctxt) ??
        Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey);

    assert(!!refDescriptor);

    Reflect.defineMetadata('aspectjs.refDescriptor', refDescriptor, target.proto, ctxt.target.propertyKey);

    const newDescriptor = { ...refDescriptor };
    newDescriptor.value = function(...args: any[]) {
        const r = runner.method;
        try {
            ctxt.args = args;
            ctxt.instance = this;
            r[PointcutPhase.BEFORE](ctxt);

            r[PointcutPhase.AROUND](ctxt);
            assert(!ctxt.joinpoint);

            return r[PointcutPhase.AFTERRETURN](ctxt);
        } catch (e) {
            ctxt.error = e;
            return r[PointcutPhase.AFTERTHROW](ctxt);
        } finally {
            r[PointcutPhase.AFTER](ctxt);
        }
    };
    Reflect.defineProperty(newDescriptor.value, 'name', {
        value: ctxt.target.propertyKey,
    });
    newDescriptor.name = ctxt.target.propertyKey;

    return newDescriptor;
}

const _defineProperty = Object.defineProperty;
function _createParameterDecoration(ctxt: AdviceContextImpl<any, AnnotationType.METHOD>, runner: AdviceRunners): void {
    const newDescriptor = _createMethodDecoration(ctxt as any, runner);

    Reflect.defineProperty(ctxt.target.proto, ctxt.target.propertyKey, newDescriptor);

    // To override method descriptor from parameter decorator is not allowed..
    // Return value of parameter decorators is ignored
    // Moreover, Reflect.decorate will overwrite any changes made on proto[propertyKey]
    // We monkey patch Object.defineProperty to prevent this;
    Object.defineProperty = function(o: any, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
        if (o === ctxt.target.proto && p === ctxt.target.propertyKey) {
            // prevent writing back old descriptor
            Object.defineProperty = _defineProperty;
            return newDescriptor;
        }

        return _defineProperty(o, p, attributes);
    };

    return newDescriptor as any;
}
