import { assert } from '@aspectjs/core/utils';
import { WeavingError } from '../weaver/errors/weaving-error';
import {
    Annotation,
    AnnotationRef,
    AdviceType,
    ClassAnnotation,
    MethodAnnotation,
    ParameterAnnotation,
    PropertyAnnotation,
} from '../annotation/annotation.types';

export interface PointcutOption {
    priority?: number;
}

export class PointcutExpression {
    private readonly _name = '*'; // TODO
    private readonly _expr: string;

    static of<T extends AdviceType>(type: T, annotation: AnnotationRef) {
        return AnnotationPointcutExpressionBuilders[type].withAnnotations(annotation as any);
    }
    constructor(private _label: string, private _annotations: AnnotationRef[] = []) {
        this._expr = _trimSpaces(
            `${this._label} ${this._annotations.map((a) => a.toString()).join(',')} ${this._name}`,
        );
    }
    toString(): string {
        return this._expr;
    }
}

function _trimSpaces(s: string) {
    return s.replace(/\s+/, ' ');
}

class AnnotationPointcutExpressionBuilder<A extends Annotation<any>> {
    constructor(private _label: string) {}

    withAnnotations(...annotation: Annotation[]): PointcutExpression {
        return new PointcutExpression(this._label, annotation);
    }
}

class PropertyAnnotationPointcutExpressionBuilder {
    readonly setter = new AnnotationPointcutExpressionBuilder<ParameterAnnotation>('property#set');

    withAnnotations(...annotation: PropertyAnnotation[]): PointcutExpression {
        return new PointcutExpression('property#get', annotation);
    }
}

interface PointcutExpressionBuilder {
    readonly class: AnnotationPointcutExpressionBuilder<ClassAnnotation>;
    readonly property: PropertyAnnotationPointcutExpressionBuilder;
    readonly method: AnnotationPointcutExpressionBuilder<MethodAnnotation>;
    readonly parameter: AnnotationPointcutExpressionBuilder<ParameterAnnotation>;
}

const AnnotationPointcutExpressionBuilders = {
    [AdviceType.CLASS]: new AnnotationPointcutExpressionBuilder<ClassAnnotation>('class'),
    [AdviceType.METHOD]: new AnnotationPointcutExpressionBuilder<MethodAnnotation>('method'),
    [AdviceType.PARAMETER]: new AnnotationPointcutExpressionBuilder<MethodAnnotation>('parameter'),
    [AdviceType.PROPERTY]: new PropertyAnnotationPointcutExpressionBuilder(),
};
export const on: PointcutExpressionBuilder = {
    class: AnnotationPointcutExpressionBuilders[AdviceType.CLASS],
    method: AnnotationPointcutExpressionBuilders[AdviceType.METHOD],
    parameter: AnnotationPointcutExpressionBuilders[AdviceType.PARAMETER],
    property: AnnotationPointcutExpressionBuilders[AdviceType.PROPERTY],
};

export enum PointcutPhase {
    COMPILE = 'Compile',
    AROUND = 'Around',
    BEFORE = 'Before',
    AFTERRETURN = 'AfterReturn',
    AFTER = 'After',
    AFTERTHROW = 'AfterThrow',
}

export interface Pointcut<A extends AdviceType = any> {
    readonly options: PointcutOption;
    readonly type: A;
    readonly annotation: AnnotationRef;
    readonly name: string;
    readonly phase: PointcutPhase;
    readonly ref: string;
}

export namespace Pointcut {
    const POINTCUT_REGEXPS = {
        [AdviceType.CLASS]: new RegExp('class(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*'),
        [AdviceType.PROPERTY]: new RegExp(
            'property#(?:get|set)(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*',
        ),
        [AdviceType.METHOD]: new RegExp('method(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*'),
        [AdviceType.PARAMETER]: new RegExp('parameter(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*'),
    };

    export function of(phase: PointcutPhase, exp: string, options?: PointcutOption): Pointcut;
    export function of(phase: PointcutPhase, exp: PointcutExpression, options?: PointcutOption): Pointcut;
    export function of(phase: PointcutPhase, exp: PointcutExpression | string, options: PointcutOption = {}): Pointcut {
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
                    annotation: AnnotationRef.of(match.groups.annotation),
                    name: match.groups.name,
                    ref,
                    options,
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

export interface CompilePointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.COMPILE;
}
export interface AroundPointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.AROUND;
}
export interface BeforePointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.BEFORE;
}
export interface AfterReturnPointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.AFTERRETURN;
}
export interface AfterPointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.AFTER;
}
export interface AfterThrowPointcut<A extends AdviceType = any> extends Pointcut<A> {
    phase: PointcutPhase.AFTERTHROW;
}
