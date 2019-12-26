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

        const annotation = function(...annotationArgs: any[]) {
            const weaver = getWeaver(groupId) ?? getWeaver();
            if (!weaver.isLoaded()) {
                throw new WeavingError(
                    'Weaving did not happen. Please make sure to call "getWeaver().load()" before creating annotations',
                );
            }

            return _createDecorator(weaver, annotation, annotationArgs);
        } as S;

        _setAnnotationRef(annotation, annotationStub);

        getMetaOrDefault('aspectjs.referenceAnnotation', annotationStub, () => {
            Reflect.defineMetadata('aspectjs.referenceAnnotation', annotationStub, annotation);
            return annotationStub;
        });

        annotation.groupId = this._groupId;

        return annotation;
    }
}

function _setAnnotationRef(fn: Function, annotationRef: AnnotationRef) {
    assert(typeof fn === 'function');

    Object.defineProperties(fn, Object.getOwnPropertyDescriptors(annotationRef));
}

function _setFunctionName(fn: Function, name: string) {
    assert(typeof fn === 'function');

    Object.defineProperty(fn, 'name', {
        value: name,
    });
}

function _createDecorator<A extends Annotation>(weaver: Weaver, annotation: A, annotationArgs: any[]) {
    const decorator = function(...targetArgs: any[]) {
        const target = AnnotationTargetFactory.of(targetArgs) as AnnotationTarget<any, A>;

        let decoration: Function;
        if (target.type === AnnotationTargetType.CLASS) {
            return _createClassDecoration(target);
        } else {
            assert(false, 'not implemented'); // TODO
        }

        return decoration;
    };
    _setAnnotationRef(decorator, annotation);

    return decorator;

    function _createClassDecoration(target: AnnotationTarget<any, A>) {
        // eslint-disable-next-line @typescript-eslint/class-name-casing
        const decoration = class extends target.proto.constructor {
            constructor(...ctorArgs: any[]) {
                let originalCtorWrapper = (...args: any[]) => {
                    originalCtorWrapper = () => {
                        throw new WeavingError(`joinPoint already proceeded`);
                    };
                    return new target.proto.constructor(...args);
                };

                let ctxt = new AnnotationContextImpl(target, null, annotation, annotationArgs);
                Reflect.defineProperty(ctxt, 'instance', {
                    get() {
                        throw new WeavingError('cannot get instance of "this" before constructor has been called');
                    },
                });
                Object.seal(ctxt);
                try {
                    weaver.getAdvices('before').forEach((advice: BeforeAdvice<unknown>) => advice(ctxt));

                    const aroundAdvices = weaver.getAdvices('around');
                    if (aroundAdvices.length) {
                        aroundAdvices.forEach((advice: AroundAdvice<unknown>) =>
                            advice(ctxt, (...args: any[]) => {
                                const instance = originalCtorWrapper(args);
                                ctxt = new AnnotationContextImpl(target, instance, annotation, annotationArgs);
                            }),
                        );
                    } else {
                        super(...ctorArgs);
                        ctxt = new AnnotationContextImpl(target, this, annotation, annotationArgs);
                    }

                    weaver.getAdvices('afterReturn').forEach((advice: AfterReturnAdvice<unknown>) => advice(ctxt));
                } catch (e) {
                    if (e instanceof WeavingError) {
                        throw e;
                    }
                    weaver.getAdvices('afterThrow').forEach((advice: AfterThrowAdvice<unknown>) => advice(ctxt));
                } finally {
                    weaver.getAdvices('after').forEach((advice: AfterAdvice<unknown>) => advice(ctxt));
                }
            }
        };

        return decoration;
    }
}
