import {
    Annotation,
    AnnotationRef,
    AnnotationType,
    ClassAnnotationStub,
    MethodAnnotationStub,
    ParameterAnnotationStub,
    PropertyAnnotationStub,
} from '../annotation.types';
import { WeavingError } from '../../weaver/weaving-error';
import { Weaver } from '../../weaver/load-time/load-time-weaver';
import { assert, getMetaOrDefault, isUndefined, Mutable } from '../../utils';
import { AnnotationContext } from '../context/context';
import { AnnotationTargetFactory } from '../target/annotation-target-factory';
import { getWeaver, JoinPoint } from '../../index';
import { AnnotationTarget, AnnotationTargetType } from '../target/annotation-target';
import { AnnotationBundleFactory, AnnotationsBundleImpl } from '../bundle/bundle-factory';
import { AdviceContext, MutableAdviceContext } from '../../weaver/advices/advice-context';
import { InstanceResolver } from '../../weaver/instance-resolver';

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

    create<A extends AnnotationType, S extends Annotation>(annotationStub: S): S & AnnotationRef {
        if (!annotationStub.name) {
            throw new TypeError('Annotation functions should have a name');
        }
        const groupId = this._groupId;

        // create the annotation (ie: decorator provider)
        const annotation = function(...annotationArgs: any[]): Decorator {
            // assert the weaver is loaded before invoking the underlying decorator
            const weaver = getWeaver(groupId) ?? getWeaver();
            if (!weaver.isLoaded()) {
                throw new WeavingError(
                    'Weaving did not happen. Please make sure to call "getWeaver().load()" before creating annotations',
                );
            }

            const decorator = _createDecorator(weaver, annotation as any, annotationArgs);
            _createAnnotationRef(decorator, annotationStub, groupId);

            return decorator;
        };

        return _createAnnotationRef(annotation, annotationStub, groupId);
    }
}

function _createAnnotationRef<A extends Annotation, D extends Decorator>(
    fn: Function & D,
    annotationStub: A,
    groupId: string,
): AnnotationRef & A {
    assert(typeof fn === 'function');

    const annotation = (fn as any) as AnnotationRef & A;
    Object.defineProperties(annotation, Object.getOwnPropertyDescriptors(annotationStub));
    annotation.groupId = groupId;
    annotation.toString = function() {
        return `@${annotation.name}`;
    };

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

    Object.defineProperty(Reflect.getPrototypeOf(fn), Symbol.toPrimitive, {
        enumerable: false,
        configurable: true,
        value: () => tag,
    });
}

function _createDecorator<A extends Annotation>(weaver: Weaver, annotation: A, annotationArgs: any[]): Decorator {
    return function(...targetArgs: any[]): Function {
        const target = AnnotationTargetFactory.of(targetArgs) as AnnotationTarget<any, A>;

        if (target.type === AnnotationTargetType.CLASS) {
            return _createClassDecoration(target);
        } else {
            assert(false, 'not implemented'); // TODO
        }
    };

    function _createClassDecoration<T>(target: AnnotationTarget<T, A>): Function {
        // eslint-disable-next-line @typescript-eslint/class-name-casing

        const annotationContext = new AnnotationContextImpl(target, annotationArgs, annotation);

        // TODO
        // const compiler = weaver.compile(annotationContext);
        // compiler.compile();

        const ctor = function(...ctorArgs: any[]): T {
            // prevent getting reference to this until ctor has been called
            const instanceResolver = new InstanceResolver<T>();

            const ctxt = new AnnotationAspectContextImpl();
            ctxt.instance = instanceResolver;
            ctxt.annotation = annotationContext;
            ctxt.args = ctorArgs;

            const runner = weaver.run(ctxt);
            try {
                runner.class.before();
                instanceResolver.resolve(this);
                runner.class.around();

                runner.class.afterReturn();

                return instanceResolver.get();
            } catch (e) {
                // consider WeavingErrors as not recoverable by an aspect
                if (e instanceof WeavingError) {
                    throw e;
                }

                ctxt.error = e;
                runner.class.afterThrow();
                return instanceResolver.get();
            } finally {
                runner.class.after();
            }
        };

        _setFunctionName(ctor, target.proto.constructor.name, `class ${target.proto.constructor.name} {}`);
        return ctor;
    }
}

class AnnotationAspectContextImpl<T, A extends AnnotationType> implements MutableAdviceContext<A> {
    public error?: Error;
    public annotation?: AnnotationContextImpl<T, A>;
    public instance?: InstanceResolver<T>;
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
            }, Object.create(Reflect.getPrototypeOf(this))) as Mutable<AdviceContext<any, AnnotationType>>,
        );
    }
}

class AnnotationContextImpl<T, D extends AnnotationType> implements AnnotationContext<T, D> {
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
