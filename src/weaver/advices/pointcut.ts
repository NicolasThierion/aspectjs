import {
    Annotation,
    AnnotationRef,
    AnnotationType,
    ClassAnnotation,
    MethodAnnotation,
    ParameterAnnotation,
    PropertyAnnotation,
} from '../..';
import { assert } from '../../utils';
import { WeavingError } from '../weaving-error';

export interface Pointcut {
    options: PointcutOption;
    type: AnnotationType;
    annotation: AnnotationRef;
    name: string;
    phase: PointcutPhase;
    ref: string;
}

export interface PointcutOption {
    priority?: number;
}

export abstract class PointcutExpression {
    protected _annotations: Annotation<AnnotationType>[] = [];
    protected _name = '*';

    withAnnotations(...annotation: Annotation<AnnotationType>[]): PointcutExpression {
        this._annotations = annotation;
        return this;
    }
}

export class ClassPointcutExpression extends PointcutExpression {
    constructor(private _selector?: PointcutExpression) {
        super();
    }

    toString(): string {
        return _trimSpaces(
            `class ${this._annotations.map(a => a.toString()).join(',')}${this._selector ? ` ${this._selector}` : ''} ${
                this._name
            }`,
        );
    }

    withAnnotations(...annotations: ClassAnnotation[]): ClassPointcutExpression {
        return super.withAnnotations(...annotations);
    }
}

export class PropertyPointcutExpression extends PointcutExpression {
    public readonly setter = new PropertySetterPointcutExpression();

    toString(): string {
        return _trimSpaces(`property#get ${this._annotations.map(a => a.toString()).join(',')} ${this._name}`);
    }

    withAnnotations(...annotations: PropertyAnnotation[]): PropertyPointcutExpression {
        super.withAnnotations(...annotations);
        return this;
    }
}

export class PropertySetterPointcutExpression extends PointcutExpression {
    toString(): string {
        return _trimSpaces(`property#set ${this._annotations.map(a => a.toString()).join(',')} ${this._name}`);
    }

    withAnnotations(...annotation: PropertyAnnotation[]): PropertySetterPointcutExpression {
        return super.withAnnotations(...annotation);
    }
}

export class MethodPointcutExpression extends PointcutExpression {
    toString(): string {
        return _trimSpaces(`method ${this._annotations.map(a => a.toString()).join(',')} ${this._name}`);
    }

    withAnnotations(...annotation: MethodAnnotation[]): MethodPointcutExpression {
        return super.withAnnotations(...annotation);
    }
}

export class ParameterPointcutExpression extends PointcutExpression {
    toString(): string {
        return _trimSpaces(`parameter ${this._annotations.map(a => a.toString()).join(',')} ${this._name}`);
    }

    withAnnotations(...annotation: ParameterAnnotation[]): ParameterPointcutExpression {
        return super.withAnnotations(...annotation);
    }
}

function _trimSpaces(s: string) {
    return s.replace(/\s+/, ' ');
}

class PointcutExpressionFactory {
    get class() {
        return new ClassPointcutExpression();
    }

    get property() {
        return new PropertyPointcutExpression();
    }

    get method() {
        return new MethodPointcutExpression();
    }
    get parameter() {
        return new ParameterPointcutExpression();
    }
}

export const on = new PointcutExpressionFactory();

export enum PointcutPhase {
    COMPILE = 'Compile',
    AROUND = 'Around',
    BEFORE = 'Before',
    AFTERRETURN = 'AfterReturn',
    AFTER = 'After',
    AFTERTHROW = 'AfterThrow',
}

export namespace Pointcut {
    export function of(phase: PointcutPhase, exp: string, options: PointcutOption): Pointcut;
    export function of(phase: PointcutPhase, exp: PointcutExpression, options: PointcutOption): Pointcut;
    export function of(phase: PointcutPhase, exp: PointcutExpression | string, options: PointcutOption = {}): Pointcut {
        const ref = exp.toString();

        const pointcutRegexes = {
            [AnnotationType.CLASS]: new RegExp('class(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*'),
            [AnnotationType.PROPERTY]: new RegExp(
                'property#(?:get|set)(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*',
            ),
            [AnnotationType.METHOD]: new RegExp(
                'method(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*',
            ),
            [AnnotationType.PARAMETER]: new RegExp(
                'parameter(?:\\s+\\@(?<annotation>\\S+?:\\S+))?(?:\\s+(?<name>\\S+?))\\s*',
            ),
        };

        let pointcut: Pointcut;

        for (const entry of Object.entries(pointcutRegexes)) {
            const [type, regex] = entry;
            const match = regex.exec(ref);

            if (match?.groups.name) {
                assert(!!match.groups.annotation, 'only annotation pointcuts are supported');
                pointcut = {
                    type: type as AnnotationType,
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

export interface CompilePointcut extends Pointcut {
    phase: PointcutPhase.COMPILE;
}
export interface AroundPointcut extends Pointcut {
    phase: PointcutPhase.AROUND;
}
export interface BeforePointcut extends Pointcut {
    phase: PointcutPhase.BEFORE;
}
export interface AfterReturnPointcut extends Pointcut {
    phase: PointcutPhase.AFTERRETURN;
}
export interface AfterPointcut extends Pointcut {
    phase: PointcutPhase.AFTER;
}
export interface AfterThrowPointcut extends Pointcut {
    phase: PointcutPhase.AFTERTHROW;
}
