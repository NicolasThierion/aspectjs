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
import {
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AroundAdvice,
    BeforeAdvice,
    JoinPoint,
} from '../../weaver/types';
import { Weaver } from '../../weaver/load-time/load-time-weaver';
import { assert, getMetaOrDefault, isArray } from '../../utils';
import { AnnotationContextImpl } from '../context/context';
import { AnnotationTargetFactory } from '../target/annotation-target-factory';
import { getWeaver } from '../../index';
import { AnnotationTarget, AnnotationTargetType } from '../target/annotation-target';

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
        const annotation = function(...annotationArgs: any[]) {
            // assert the weaver is loaded before invoking the underlying decorator
            const weaver = getWeaver(groupId) ?? getWeaver();
            if (!weaver.isLoaded()) {
                throw new WeavingError(
                    'Weaving did not happen. Please make sure to call "getWeaver().load()" before creating annotations',
                );
            }

            const decorator = _createDecorator(weaver, annotation, annotationArgs);
            _createAnnotationRef(decorator as S, annotationStub, groupId);

            return decorator;
        } as S;

        return _createAnnotationRef(annotation, annotationStub, groupId);
    }
}

function _createAnnotationRef<S extends Annotation>(
    fn: Function & S,
    annotationStub: S,
    groupId: string,
): AnnotationRef & S {
    assert(typeof fn === 'function');

    const annotation = (fn as any) as AnnotationRef & S;
    Object.defineProperties(annotation, Object.getOwnPropertyDescriptors(annotationStub));
    annotation.groupId = groupId;

    getMetaOrDefault('aspectjs.referenceAnnotation', annotationStub, () => {
        Reflect.defineMetadata('aspectjs.referenceAnnotation', annotationStub, fn);
        return annotationStub;
    });

    return annotation;
}

function _setFunctionName(fn: Function, name: string): void {
    assert(typeof fn === 'function');

    Object.defineProperty(fn, 'name', {
        value: name,
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
        const ctor = function(...ctorArgs: any[]): void {
            // set 'this' to null, as ctor joinpoint has not been called yet
            const ctxt = new AnnotationContextImpl(target, null, annotation, annotationArgs);
            const jpf = new JoinpointFactory();

            // prevent getting reference to this until ctor has been called
            const thisHolder = {
                instance(): any {
                    throw new WeavingError('Cannot get "this" instance before constructor joinpoint has been called');
                },
            };
            Reflect.defineProperty(ctxt, 'instance', {
                get() {
                    return thisHolder.instance();
                },
            });

            // create joinpoint toward ctor
            let jp = jpf.create(
                (args: any[]) => new target.proto.constructor(...args),
                () => ctorArgs,
            );

            try {
                weaver.getAdvices('before').forEach((advice: BeforeAdvice<unknown>) => advice(ctxt));

                const aroundAdvices = weaver.getAdvices('around') as AroundAdvice<T>[];
                if (aroundAdvices.length) {
                    // allow call to fake 'this'
                    let instance = Object.create(target.proto);
                    let dirty = false;
                    thisHolder.instance = () => {
                        dirty = true;
                        return instance;
                    };
                    const oldJp = jp;
                    jp = jpf.create(
                        (args: any[]) => {
                            if (dirty) {
                                throw new Error(
                                    `Cannot get "this" instance of constructor before joinpoint has been called`,
                                );
                            }
                            instance = oldJp(args);
                            thisHolder.instance = () => instance;
                        },
                        () => ctorArgs,
                    );

                    let aroundAdvice = aroundAdvices.shift();

                    let previousArgs = ctorArgs;
                    while (aroundAdvices.length) {
                        const previousAroundAdvice = aroundAdvice;
                        aroundAdvice = aroundAdvices.shift();
                        const previousJp = jp;
                        jp = jpf.create(
                            (...args: any[]) => {
                                previousArgs = args ?? previousArgs;
                                previousAroundAdvice(ctxt, previousJp, args);
                            },
                            () => previousArgs,
                        );
                    }

                    aroundAdvice(ctxt, jp, ctorArgs);
                } else {
                    const instance = jp(ctorArgs);
                    thisHolder.instance = () => instance;
                }

                // assign 'this' to the object created by the original ctor at joinpoint;
                Object.assign(this, ctxt.instance);
                thisHolder.instance = () => this;

                weaver.getAdvices('afterReturn').forEach((advice: AfterReturnAdvice<unknown>) => advice(ctxt));
            } catch (e) {
                if (e instanceof WeavingError) {
                    throw e;
                }
                const afterThrowAdvices = weaver.getAdvices('afterThrow');
                if (!afterThrowAdvices.length) {
                    // pass-trough errors by default
                    throw e;
                } else {
                    afterThrowAdvices.forEach((advice: AfterThrowAdvice<unknown>) => advice(ctxt));
                }
            } finally {
                weaver.getAdvices('after').forEach((advice: AfterAdvice<unknown>) => advice(ctxt));
            }
        };

        _setFunctionName(ctor, target.proto.constructor.name);
        return ctor;
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
