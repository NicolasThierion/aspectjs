import {
    Annotation,
    AnnotationRef,
    AdviceType,
    ClassAnnotationStub,
    MethodAnnotationStub,
    ParameterAnnotationStub,
    PropertyAnnotationStub,
} from '../annotation.types';
import { assert, getOrComputeMetadata, getProto } from '@aspectjs/core/utils';
import { AnnotationTargetFactory } from '../../advice/target/annotation-target.factory';
import { AnnotationBundleRegistry } from '../bundle/bundle-factory';
import { AnnotationsBundle } from '../bundle/bundle';
import { weaverContext } from '../../weaver/weaver-context';
import { AdviceTarget } from '../../advice/target/advice-target';
import { MutableAdviceContext } from '../../advice/advice-context';
import { JoinPoint } from '../../weaver/types';
import { Advice } from '../../advice/types';
import { AnnotationContext } from '../context/annotation-context';

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
        const annotation = function (...annotationArgs: any[]): Decorator {
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
                type: AdviceType.CLASS,
            }),
        );
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
        value: function () {
            return `@${annotation.groupId}:${annotation.name}`;
        },
    });

    Reflect.defineProperty(annotation, Symbol.toPrimitive, {
        enumerable: false,
        value: function () {
            return `@${annotation.name}`;
        },
    });

    getOrComputeMetadata('aspectjs.referenceAnnotation', annotationStub, () => {
        Reflect.defineMetadata('aspectjs.referenceAnnotation', annotationStub, fn);
        return annotationStub;
    });

    return annotation;
}

function _createDecorator<A extends AdviceType>(annotation: Annotation<A>, annotationArgs: any[]): Decorator {
    const GENERATORS = {
        [AdviceType.CLASS]: _createClassDecoration,
        [AdviceType.PROPERTY]: _createPropertyDecoration,
        [AdviceType.METHOD]: _createMethodDecoration,
        [AdviceType.PARAMETER]: _createParameterDecoration,
    };

    return function (...targetArgs: any[]): Function | PropertyDescriptor | void {
        // assert the weaver is loaded before invoking the underlying decorator
        const weaver = weaverContext.getWeaver();

        if (!weaver) {
            throw new Error(`Cannot invoke annotation ${annotation.name ?? ''} before "setWeaver()" has been called`);
        }

        const target = AnnotationTargetFactory.of(targetArgs) as AdviceTarget<any, A>;

        const annotationContext = new AnnotationContextImpl(target, annotationArgs, annotation);
        AnnotationBundleRegistry.addContext(target, annotationContext);

        const ctxt = new AdviceContextImpl(annotationContext);

        const generator = GENERATORS[ctxt.target.type];
        return generator(ctxt as AdviceContextImpl<any, any>);
    };
}

class AdviceContextImpl<T, A extends AdviceType> implements MutableAdviceContext<unknown, A> {
    public error: Error;
    public instance: T;
    public value: T | unknown;
    public args: any[];
    public joinpoint: JoinPoint;
    public target: AdviceTarget<T, A>;
    public data: Record<string, any>;
    public advices: Advice[];

    constructor(public annotation: AnnotationContext<T, A>) {
        this.target = annotation.target;
        this.data = {};
    }

    clone(): this {
        return Object.assign(Object.create(Reflect.getPrototypeOf(this)) as MutableAdviceContext<unknown, A>, this);
    }

    toString(): string {
        return `${this.annotation} ${this.target}`;
    }
}

class AnnotationContextImpl<T, D extends AdviceType> implements AnnotationContext<T, D> {
    public readonly name: string;
    public readonly groupId: string;
    private readonly _annotation: AnnotationRef;

    constructor(public readonly target: AdviceTarget<T, D>, public readonly args: any[], annotation: AnnotationRef) {
        this.name = annotation.name;
        this.groupId = annotation.groupId;
        this._annotation = annotation;
    }

    toString(): string {
        return this._annotation.toString();
    }
}

function _createClassDecoration<T>(ctxt: AdviceContextImpl<any, AdviceType.CLASS>): Function {
    return weaverContext.getWeaver().enhanceClass(ctxt);
}

function _createPropertyDecoration(ctxt: AdviceContextImpl<any, AdviceType.PROPERTY>): PropertyDescriptor {
    return weaverContext.getWeaver().enhanceProperty(ctxt);
}

function _createMethodDecoration(ctxt: AdviceContextImpl<any, AdviceType.METHOD>): PropertyDescriptor {
    return weaverContext.getWeaver().enhanceMethod(ctxt);
}

function _createParameterDecoration(ctxt: AdviceContextImpl<any, AdviceType.METHOD>): void {
    return weaverContext.getWeaver().enhanceParameter(ctxt);
}
