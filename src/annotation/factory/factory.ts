import {
    Annotation,
    AnnotationRef,
    ClassAnnotationStub,
    MethodAnnotationStub,
    ParameterAnnotationStub,
    PropertyAnnotationStub,
} from '../annotation.types';
import { WeavingError } from '../../weaver/weaving-error';
import { PointcutsRunner } from '../../weaver/weaver';
import { assert, getMetaOrDefault } from '../../utils';
import { AnnotationContext } from '../context/context';
import { AdviceTargetFactory } from '../target/advice-target-factory';
import { getWeaver, JoinPoint } from '../../index';
import { AdviceTarget } from '../target/advice-target';
import { AnnotationBundleFactory, AnnotationsBundleImpl } from '../bundle/bundle-factory';
import { AdviceContext, MutableAdviceContext } from '../../weaver/advices/advice-context';
import { AdviceType } from '../../weaver/advices/types';
import { PointcutPhase } from '../../weaver/advices/pointcut';

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

    create<S extends Annotation<AdviceType>>(annotationStub: S): S & AnnotationRef {
        if (!annotationStub.name) {
            Reflect.defineProperty(annotationStub, 'name', {
                value: `anonymousAnnotation#${generatedId++}`,
            });
        }
        const groupId = this._groupId;

        // create the annotation (ie: decorator provider)
        const annotation = function(...annotationArgs: any[]): Decorator {
            // assert the weaver is loaded before invoking the underlying decorator
            const weaver = getWeaver(groupId) ?? getWeaver();

            const decorator = _createDecorator(weaver.load(), annotation as any, annotationArgs);
            _createAnnotationRef(decorator, annotationStub, groupId);

            return decorator;
        };

        return _createAnnotationRef(annotation, annotationStub, groupId);
    }
}

function _createAnnotationRef<A extends Annotation<AdviceType>, D extends Decorator>(
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

function _createDecorator<TAdvice extends AdviceType, A extends Annotation<TAdvice>>(
    runner: PointcutsRunner,
    annotation: A,
    annotationArgs: any[],
): Decorator {
    return function(...targetArgs: any[]): Function | PropertyDescriptor {
        const target = AdviceTargetFactory.of(targetArgs) as AdviceTarget<any, TAdvice>;

        const annotationContext = new AnnotationContextImpl(target, annotationArgs, annotation);
        const ctxt = new AdviceContextImpl(annotationContext);

        if (target.type === AdviceType.CLASS) {
            return _createClassDecoration(ctxt);
        } else if (target.type === AdviceType.PROPERTY) {
            return _createPropertyDecoration(ctxt);
        } else {
            assert(false, 'not implemented'); // TODO
        }
    };

    function _createPropertyDecoration(ctxt: AdviceContextImpl<any, TAdvice>): PropertyDescriptor {
        const target = ctxt.target;
        const defaultDescriptor: PropertyDescriptor = {
            configurable: true,
            enumerable: true,
            get() {
                const _Reflect = Reflect; // TODO
                return _Reflect.getOwnMetadata(`aspectjs.propValue`, this, ctxt.target.propertyKey);
            },
            set(value: any) {
                const _Reflect = Reflect; // TODO
                _Reflect.defineMetadata(`aspectjs.propValue`, value, this, ctxt.target.propertyKey);
            },
        };

        const refDescriptor = {
            ...(runner.property[PointcutPhase.COMPILE](ctxt) ?? target.proto[target.propertyKey] ?? defaultDescriptor),
        };

        if ((refDescriptor as Record<string, any>).hasOwnProperty('value')) {
            const propValue = refDescriptor.value;
            refDescriptor.get = () => propValue;
            delete refDescriptor.writable;
            delete refDescriptor.value;
        }

        Reflect.defineMetadata('aspectjs.refDescriptor', refDescriptor, ctxt.target.proto);
        let propDescriptor: PropertyDescriptor = {
            ...refDescriptor,
        };
        propDescriptor.get = function() {
            const _ctxt = ctxt.clone();
            const r = runner.property.getter;
            try {
                _ctxt.instance = this;
                r[PointcutPhase.BEFORE](_ctxt);

                r[PointcutPhase.AROUND](_ctxt);

                return r[PointcutPhase.AFTERRETURN](_ctxt);
            } catch (e) {
                _ctxt.error = e;
                return r[PointcutPhase.AFTERTHROW](_ctxt);
            } finally {
                r[PointcutPhase.AFTER](_ctxt);
            }
        };

        if (_isWritable(propDescriptor)) {
            propDescriptor.set = function(...args: any[]) {
                const _ctxt = ctxt.clone();

                const r = runner.property.setter;
                try {
                    _ctxt.args = args;
                    _ctxt.instance = this;
                    r[PointcutPhase.BEFORE](_ctxt);

                    r[PointcutPhase.AROUND](_ctxt);

                    return r[PointcutPhase.AFTERRETURN](_ctxt);
                } catch (e) {
                    _ctxt.error = e;
                    // return r[PointcutPhase.AFTERTHROW](_ctxt);
                } finally {
                    // r[PointcutPhase.AFTER](_ctxt);
                }
            };

            delete propDescriptor.writable;
        } else {
            delete propDescriptor.set;
        }
        // test property validity
        propDescriptor = Object.getOwnPropertyDescriptor(
            Object.defineProperty({}, 'surrogate', propDescriptor),
            'surrogate',
        );

        target.proto[target.propertyKey] = propDescriptor;

        return propDescriptor;

        function _isWritable(propDescriptor: PropertyDescriptor) {
            const desc = propDescriptor as Record<string, any>;
            return !desc || (desc.hasOwnProperty('writable') && desc.writable) || desc.hasOwnProperty('set');
        }
    }

    function _createClassDecoration<T>(ctxt: AdviceContextImpl<any, TAdvice>): Function {
        runner.class[PointcutPhase.COMPILE](ctxt);

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

        const ctorName = ctxt.target.proto.constructor.name;
        _setFunctionName(ctor, ctorName, `class ${ctorName} {}`);

        Reflect.defineMetadata('aspectjs.referenceProto', ctor.prototype, ctxt.target.proto);
        Reflect.defineMetadata('aspectjs.referenceCtor', ctxt.target.proto.constructor, ctxt.target.proto);
        ctor.prototype = ctxt.target.proto;
        ctor.prototype.constructor = ctor;

        return ctor;
    }
}

class AdviceContextImpl<T, A extends AdviceType> implements MutableAdviceContext<A> {
    public error?: Error;
    public instance?: T;
    public value?: T | unknown;
    public args?: any[];
    public joinpoint?: JoinPoint;
    public target: AdviceTarget<T, A>;

    constructor(readonly annotation: AnnotationContextImpl<T, A>) {
        this.target = annotation.target;
    }

    clone(): this {
        return Object.assign(Object.create(Reflect.getPrototypeOf(this)) as AdviceContext<any, AdviceType>, this);
    }
}

class AnnotationContextImpl<T, D extends AdviceType> implements AnnotationContext<T, D> {
    public readonly name: string;
    public readonly groupId: string;

    constructor(public readonly target: AdviceTarget<T, D>, public readonly args: any[], annotation: AnnotationRef) {
        this.name = annotation.name;
        this.groupId = annotation.groupId;
    }

    toString(): string {
        return this.target.toString();
    }

    get bundle() {
        return AnnotationBundleFactory.of(this.target) as AnnotationsBundleImpl<any>;
    }
}
