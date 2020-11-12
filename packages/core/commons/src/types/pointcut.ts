import { WeavingError } from '../weaver/errors';
import {
    Annotation,
    AnnotationRef,
    AnnotationType,
    ClassAnnotation,
    MethodAnnotation,
    ParameterAnnotation,
    PropertyAnnotation,
} from '../annotation/annotation.types';
import { AdviceType } from '../advices/types';
import { assert } from '@aspectjs/core/utils';

/**
 * @public
 */
export class PointcutExpression {
    private readonly _name = '*'; // TODO
    private readonly _expr: string;

    static of<T extends AdviceType>(type: T, annotation: AnnotationRef) {
        return AnnotationPointcutExpressionBuilders[type].withAnnotations(annotation as any);
    }
    constructor(private _label: string, private _annotations: AnnotationRef[] = []) {
        this._expr = _trimSpaces(`${this._label} ${this._annotations.map((a) => `@${a.ref}`).join(',')} ${this._name}`);
    }
    toString(): string {
        return this._expr;
    }
}

/**
 * @public
 */
export class AnnotationPointcutExpressionBuilder<A extends Annotation> {
    constructor(private _label: string) {}

    withAnnotations(...annotation: Annotation[]): PointcutExpression {
        return new PointcutExpression(this._label, annotation);
    }
}

/**
 * @public
 */
export class PropertyAnnotationPointcutExpressionBuilder {
    readonly setter = new AnnotationPointcutExpressionBuilder<ParameterAnnotation>('property#set');

    withAnnotations(...annotation: PropertyAnnotation[]): PointcutExpression {
        return new PointcutExpression('property#get', annotation);
    }
}

/**
 * @public
 */
export interface PointcutExpressionBuilder {
    readonly class: AnnotationPointcutExpressionBuilder<ClassAnnotation>;
    readonly property: PropertyAnnotationPointcutExpressionBuilder;
    readonly method: AnnotationPointcutExpressionBuilder<MethodAnnotation>;
    readonly parameter: AnnotationPointcutExpressionBuilder<ParameterAnnotation>;
}

const AnnotationPointcutExpressionBuilders = {
    [AnnotationType.CLASS]: new AnnotationPointcutExpressionBuilder<ClassAnnotation>('class'),
    [AnnotationType.METHOD]: new AnnotationPointcutExpressionBuilder<MethodAnnotation>('method'),
    [AnnotationType.PARAMETER]: new AnnotationPointcutExpressionBuilder<MethodAnnotation>('parameter'),
    [AnnotationType.PROPERTY]: new PropertyAnnotationPointcutExpressionBuilder(),
};
/**
 * @public
 */
export const on: PointcutExpressionBuilder = {
    class: AnnotationPointcutExpressionBuilders[AnnotationType.CLASS],
    method: AnnotationPointcutExpressionBuilders[AnnotationType.METHOD],
    parameter: AnnotationPointcutExpressionBuilders[AnnotationType.PARAMETER],
    property: AnnotationPointcutExpressionBuilders[AnnotationType.PROPERTY],
};

/**
 * @public
 */
export enum PointcutPhase {
    COMPILE = 'Compile',
    AROUND = 'Around',
    BEFORE = 'Before',
    AFTERRETURN = 'AfterReturn',
    AFTER = 'After',
    AFTERTHROW = 'AfterThrow',
}

/**
 * @public
 */
export interface Pointcut<A extends AdviceType = any> {
    readonly type: A;
    readonly annotation: AnnotationRef;
    readonly name: string;
    readonly phase: PointcutPhase;
    readonly ref: string;
}

/**
 * @public
 */
export namespace Pointcut {
    const POINTCUT_REGEXPS = {
        [AdviceType.CLASS]: new RegExp('class(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*'),
        [AdviceType.PROPERTY]: new RegExp(
            'property#(?:get|set)(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*',
        ),
        [AdviceType.METHOD]: new RegExp('method(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*'),
        [AdviceType.PARAMETER]: new RegExp('parameter(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*'),
    };

    export function of(phase: PointcutPhase, exp: PointcutExpression | string): Pointcut {
        const ref = exp.toString();

        let pointcut: Pointcut;

        for (const entry of Object.entries(POINTCUT_REGEXPS)) {
            const [type, regex] = entry;
            const match = regex.exec(ref);

            if (match?.groups.name) {
                assert(!!match.groups.annotation, 'only annotation pointcuts are supported');
                pointcut = {
                    type: type as AdviceType,
                    phase,
                    annotation: new AnnotationRef(match.groups.annotation),
                    name: match.groups.name,
                    ref,
                };

                Reflect.defineProperty(pointcut, Symbol.toPrimitive, {
                    value: () => `${phase}(${ref})`,
                });

                return pointcut;
            }
        }

        throw new WeavingError(`expression ${ref} not recognized as valid pointcut expression`);
    }
}

/**
 * @public
 */
export interface CompilePointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.COMPILE;
}
/**
 * @public
 */
export interface AroundPointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.AROUND;
}
/**
 * @public
 */
export interface BeforePointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.BEFORE;
}
/**
 * @public
 */
export interface AfterReturnPointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.AFTERRETURN;
}
/**
 * @public
 */
export interface AfterPointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.AFTER;
}
/**
 * @public
 */
export interface AfterThrowPointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.AFTERTHROW;
}

function _trimSpaces(s: string) {
    return s.replace(/\s+/, ' ');
}
