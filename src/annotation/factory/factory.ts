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
import { assert, getMetaOrDefault, isUndefined, Mutable } from '../../utils';
import { AnnotationContext } from '../context/context';
import { AnnotationTargetFactory } from '../target/annotation-target-factory';
import { getWeaver, JoinPoint } from '../../index';
import { AnnotationTarget } from '../target/annotation-target';
import { AnnotationBundleFactory, AnnotationsBundleImpl } from '../bundle/bundle-factory';
import { AdviceContext, MutableAdviceContext } from '../../weaver/advices/advice-context';
import { AdviceType } from '../../weaver/advices/types';

type Decorator = ClassDecorator | MethodDecorator | PropertyDecorator | ParameterDecorator;

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
            throw new TypeError('Annotation functions should have a name');
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
        const target = AnnotationTargetFactory.of(targetArgs) as AnnotationTarget<any, TAdvice>;

        const annotationContext = new AnnotationContextImpl(target, annotationArgs, annotation);
        const ctxt = new AnnotationAdviceContextImpl(annotationContext);

        if (target.type === AdviceType.CLASS) {
            return _createClassDecoration(ctxt);
        } else if (target.type === AdviceType.PROPERTY) {
            return _createPropertyDecoration(ctxt);
        } else {
            assert(false, 'not implemented'); // TODO
        }
    };

    function _createPropertyDecoration(ctxt: AnnotationAdviceContextImpl<any, TAdvice>): PropertyDescriptor {
        const target = ctxt.annotation.target;
        let propValue: unknown;
        const defaultDescriptor: PropertyDescriptor = {
            configurable: true,
            enumerable: true,
            get() {
                return propValue;
            },
            set(value: any) {
                propValue = value;
            },
        };

        let refDescriptor = runner.property.compile(ctxt) ?? target.proto[target.propertyKey];
        if (refDescriptor) {
            // test property validity
            refDescriptor = Object.getOwnPropertyDescriptor(
                Object.defineProperty({}, 'surrogate', refDescriptor),
                'surrogate',
            );
        }

        let propDescriptor: PropertyDescriptor = {
            ...defaultDescriptor,
            ...refDescriptor,
        };

        if ((propDescriptor as Record<string, any>).hasOwnProperty('value')) {
            propValue = propDescriptor.value;
            if ((propDescriptor as Record<string, any>).hasOwnProperty('writable')) {
                if (!propDescriptor.writable) {
                    delete propDescriptor.set;
                }
                delete propDescriptor.writable;
                delete propDescriptor.value;
            }
        }

        // test property validity
        propDescriptor = Object.getOwnPropertyDescriptor(
            Object.defineProperty({}, 'surrogate', propDescriptor),
            'surrogate',
        );

        target.proto[target.propertyKey] = propDescriptor;

        return propDescriptor;
    }

    function _createClassDecoration<T>(ctxt: AnnotationAdviceContextImpl<any, TAdvice>): Function {
        runner.class.compile(ctxt);

        const ctor = function(...ctorArgs: any[]): T {
            ctxt.args = ctorArgs;

            try {
                runner.class.before(ctxt);
                ctxt.instance = this;
                runner.class.around(ctxt);

                runner.class.afterReturn(ctxt);

                return ctxt.instance;
            } catch (e) {
                // consider WeavingErrors as not recoverable by an aspect
                if (e instanceof WeavingError) {
                    throw e;
                }

                ctxt.error = e;
                runner.class.afterThrow(ctxt);
                return ctxt.instance;
            } finally {
                runner.class.after(ctxt);
            }
        };

        const ctorName = ctxt.annotation.target.proto.constructor.name;
        _setFunctionName(ctor, ctorName, `class ${ctorName} {}`);

        return ctor;
    }
}

class AnnotationAdviceContextImpl<T, A extends AdviceType> implements MutableAdviceContext<A> {
    constructor(readonly annotation: AnnotationContextImpl<T, A>) {}

    public error?: Error;
    public instance?: T;
    public args?: any[];
    public joinpoint?: JoinPoint;
    public returnValue?: unknown;

    freeze(): AdviceContext<T, A> {
        return Object.freeze(
            Object.entries(this).reduce((cpy, e) => {
                if (!isUndefined(e[1])) {
                    cpy[e[0]] = e[1];
                }
                return cpy;
            }, Object.create(Reflect.getPrototypeOf(this))) as Mutable<AdviceContext<any, AdviceType>>,
        );
    }
}

class AnnotationContextImpl<T, D extends AdviceType> implements AnnotationContext<T, D> {
    public readonly name: string;
    public readonly groupId: string;

    constructor(
        public readonly target: AnnotationTarget<T, D>,
        public readonly args: any[],
        annotation: AnnotationRef,
    ) {
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
