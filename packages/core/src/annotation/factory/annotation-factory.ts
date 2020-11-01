import {
    Annotation,
    AnnotationRef,
    ClassAnnotationStub,
    MethodAnnotationStub,
    ParameterAnnotationStub,
    PropertyAnnotationStub,
} from '../annotation.types';
import { assert, getOrComputeMetadata } from '@aspectjs/core/utils';
import { WEAVER_CONTEXT } from '../../weaver/weaver-context';
import { AdviceTarget, AnnotationTarget } from '../target/annotation-target';
import { MutableAdviceContext } from '../../advice/advice-context';
import { JoinPoint } from '../../weaver/types';
import { Advice, AdviceType } from '../../advice/types';
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
    create<A extends ClassAnnotationStub>(annotationStub?: A): A & AnnotationRef;
    create<A extends MethodAnnotationStub>(annotationStub?: A): A & AnnotationRef;
    create<A extends PropertyAnnotationStub>(annotationStub?: A): A & AnnotationRef;
    create<A extends ParameterAnnotationStub>(annotationStub?: A): A & AnnotationRef;

    create<S extends Annotation<AdviceType>>(annotationStub?: S): S & AnnotationRef {
        const groupId = this._groupId;

        // create the annotation (ie: decorator provider)
        const annotation = function (...annotationArgs: any[]): Decorator {
            const decorator = _createRegisterAnnotationDecorator(annotation as any, annotationStub, annotationArgs);
            _createAnnotation(decorator, annotationStub, groupId);

            return decorator;
        };

        // turn the stub into an annotation
        return _createAnnotation(annotation, annotationStub, groupId);
    }
}

function _createAnnotation<A extends Annotation<AdviceType>, D extends Decorator>(
    fn: Function & D,
    annotationStub: A,
    groupId: string,
): A {
    assert(typeof fn === 'function');

    // ensure annotation has a name.
    annotationStub = annotationStub ?? (function () {} as A);
    if (!annotationStub.name) {
        Reflect.defineProperty(annotationStub, 'name', {
            value: `anonymousAnnotation#${generatedId++}`,
        });
    }

    const annotationRef = new AnnotationRef(groupId, annotationStub.name);
    const annotation = Object.defineProperties(fn, Object.getOwnPropertyDescriptors(annotationRef)) as AnnotationRef &
        A;
    Object.defineProperties(annotation, Object.getOwnPropertyDescriptors(annotationStub));
    assert(Object.getOwnPropertySymbols(annotation).indexOf(Symbol.toPrimitive) >= 0);

    getOrComputeMetadata('aspectjs.referenceAnnotation', annotationStub, () => {
        Reflect.defineMetadata('aspectjs.referenceAnnotation', annotationStub, fn);
        return annotationStub;
    });

    return annotation;
}

function _createRegisterAnnotationDecorator<A extends AdviceType, S extends Annotation<AdviceType>>(
    annotation: Annotation<A>,
    annotationStub: S,
    annotationArgs: any[],
): Decorator {
    const GENERATORS = {
        [AdviceType.CLASS]: _createClassDecoration,
        [AdviceType.PROPERTY]: _createPropertyDecoration,
        [AdviceType.METHOD]: _createMethodDecoration,
        [AdviceType.PARAMETER]: _createParameterDecoration,
    };

    return function (...targetArgs: any[]): Function | PropertyDescriptor | void {
        annotationStub(...annotationArgs)?.apply(null, targetArgs);

        // assert the weaver is loaded before invoking the underlying decorator
        const weaver = WEAVER_CONTEXT.getWeaver();

        if (!weaver) {
            throw new Error(`Cannot invoke annotation ${annotation.name ?? ''} before "setWeaver()" has been called`);
        }
        const target = WEAVER_CONTEXT.annotations.targetFactory.of(targetArgs) as AnnotationTarget<any, A>;
        const annotationContext = new AnnotationContextImpl(target, annotationArgs, annotation);

        WEAVER_CONTEXT.annotations.registry.register(annotationContext);

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

class AnnotationContextImpl<T, D extends AdviceType> extends AnnotationContext<T, D> {
    constructor(public readonly target: AdviceTarget<T, D>, public readonly args: any[], annotation: AnnotationRef) {
        super(annotation.groupId, annotation.name);
    }
}

function _createClassDecoration<T>(ctxt: AdviceContextImpl<any, AdviceType.CLASS>): Function {
    return WEAVER_CONTEXT.getWeaver().enhanceClass(ctxt);
}

function _createPropertyDecoration(ctxt: AdviceContextImpl<any, AdviceType.PROPERTY>): PropertyDescriptor {
    return WEAVER_CONTEXT.getWeaver().enhanceProperty(ctxt);
}

function _createMethodDecoration(ctxt: AdviceContextImpl<any, AdviceType.METHOD>): PropertyDescriptor {
    return WEAVER_CONTEXT.getWeaver().enhanceMethod(ctxt);
}

function _createParameterDecoration(ctxt: AdviceContextImpl<any, AdviceType.METHOD>): void {
    return WEAVER_CONTEXT.getWeaver().enhanceParameter(ctxt);
}
