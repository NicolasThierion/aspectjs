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
import { AfterAdvice, AfterReturnAdvice, AfterThrowAdvice, AroundAdvice, BeforeAdvice } from '../../weaver/types';
import { Weaver } from '../../weaver/load-time/load-time-weaver';
import { assert, getMetaOrDefault } from '../../utils';
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

            return _createDecorator(weaver, annotation, annotationArgs);
        } as S;

        annotation.groupId = groupId;
        _setAnnotationRef(annotation, annotationStub);

        getMetaOrDefault('aspectjs.referenceAnnotation', annotationStub, () => {
            Reflect.defineMetadata('aspectjs.referenceAnnotation', annotationStub, annotation);
            return annotationStub;
        });

        return annotation;
    }
}

function _setAnnotationRef(fn: Function, annotationRef: AnnotationRef): void {
    assert(typeof fn === 'function');

    Object.defineProperties(fn, Object.getOwnPropertyDescriptors(annotationRef));
}

function _setFunctionName(fn: Function, name: string): void {
    assert(typeof fn === 'function');

    Object.defineProperty(fn, 'name', {
        value: name,
    });
}

function _createDecorator<A extends Annotation>(weaver: Weaver, annotation: A, annotationArgs: any[]): Decorator {
    const decorator = function(...targetArgs: any[]): Function {
        const target = AnnotationTargetFactory.of(targetArgs) as AnnotationTarget<any, A>;

        if (target.type === AnnotationTargetType.CLASS) {
            return _createClassDecoration(target);
        } else {
            assert(false, 'not implemented'); // TODO
        }
    };
    _setAnnotationRef(decorator, annotation);

    return decorator;

    function _createClassDecoration<T>(target: AnnotationTarget<T, A>): Function {
        // eslint-disable-next-line @typescript-eslint/class-name-casing
        const ctor = function(...ctorArgs: any[]): void {
            let joinPointWrapper = (...args: any[]) => {
                joinPointWrapper = () => {
                    throw new WeavingError(`joinPoint already proceeded`);
                };
                return new target.proto.constructor(...args);
            };

            const ctxt = new AnnotationContextImpl(target, null, annotation, annotationArgs);
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
            try {
                weaver.getAdvices('before').forEach((advice: BeforeAdvice<unknown>) => advice(ctxt));

                const aroundAdvices = weaver.getAdvices('around');
                if (aroundAdvices.length) {
                    // allow call to fake 'this'
                    let instance = Object.create(target.proto);
                    let dirty = false;
                    thisHolder.instance = () => {
                        dirty = true;
                        return instance;
                    };

                    aroundAdvices.forEach((advice: AroundAdvice<unknown>) =>
                        advice(ctxt, (...args: any[]) => {
                            if (dirty) {
                                throw new Error(`Cannot get "this" instance of constructor joinpoint has been called`);
                            }
                            instance = joinPointWrapper(...args);
                            thisHolder.instance = () => instance;
                        }),
                    );
                } else {
                    const instance = joinPointWrapper(...ctorArgs);
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
