import { Annotation, AnnotationRef, ClassAnnotation, PropertyAnnotation } from '../..';
import { assert } from '../../utils';
import { AdviceType } from './types';

export abstract class PointcutExpression {
    protected _annotations: Annotation<AdviceType>[] = [];

    annotations(...annotation: Annotation<AdviceType>[]): PointcutExpression {
        this._annotations = annotation;
        return this;
    }
}

export class ClassPointcutExpression extends PointcutExpression {
    constructor(private _selector?: PointcutExpression) {
        super();
    }

    protected _name = '*';
    protected _module = '*';

    annotations(...annotations: ClassAnnotation[]): PointcutExpression {
        return super.annotations(...annotations);
    }

    toString(): string {
        return `class#${this._module}:${this._name}${this._annotations.map(a => a.toString()).join(',')}${
            this._selector ? ` ${this._selector}` : ''
        }`;
    }
}

export class PropertyPointcutExpression extends PointcutExpression {
    protected _name = '*';
    public readonly setter = new PropertySetterPointcutExpression();

    annotations(...annotations: PropertyAnnotation[]): PropertyPointcutExpression {
        super.annotations(...annotations);
        return this;
    }

    toString(): string {
        return `property#get ${this._name}${this._annotations.map(a => a.toString()).join(',')}`;
    }
}

export class PropertySetterPointcutExpression extends PointcutExpression {
    protected _name = '*';

    toString(): string {
        return `property#set ${this._name}${this._annotations.map(a => a.toString()).join(',')}`;
    }
}

export class MethodPointcutExpression extends PointcutExpression {
    toString(): string {
        throw new Error('not implemented');
    }
}

export class ParameterPointcutExpression extends PointcutExpression {
    toString(): string {
        throw new Error('not implemented');
    }
}

class PointcutExpressionFactory {
    get class() {
        return new ClassPointcutExpression();
    }

    get property() {
        return new PropertyPointcutExpression();
    }

    get methods() {
        return new MethodPointcutExpression();
    }
    get args() {
        return new ParameterPointcutExpression();
    }
}

export const pc = new PointcutExpressionFactory();

export enum PointcutPhase {
    COMPILE = 'Compile',
    AROUND = 'Around',
    BEFORE = 'Before',
    AFTERRETURN = 'AfterReturn',
    AFTER = 'After',
    AFTERTHROW = 'AfterThrow',
}

export interface Pointcut {
    type: AdviceType;
    annotation: AnnotationRef;
    name: string;
    phase: PointcutPhase;
}

export namespace Pointcut {
    export function of(phase: PointcutPhase, exp: string): Pointcut;
    export function of(phase: PointcutPhase, exp: PointcutExpression): Pointcut;
    export function of(phase: PointcutPhase, exp: PointcutExpression | string): Pointcut {
        const expStr = exp.toString();

        const pointcutRegexes = {
            [AdviceType.CLASS]: new RegExp('(?:class#(?<name>\\S+?:\\S+?)(?:\\@(?<annotation>\\S+?:\\S+)\\s*)?)'),
            [AdviceType.PROPERTY]: new RegExp(
                '(?:property#(?<name>(?:set|get)\\s\\S+?)(?:\\@(?<annotation>\\S+?:\\S+)\\s*)?)',
            ),
        };

        let pointcut: Pointcut;

        for (const entry of Object.entries(pointcutRegexes)) {
            const [type, regex] = entry;
            const match = regex.exec(expStr);

            if (match?.groups.name) {
                assert(!!match.groups.annotation, 'only annotation pointcuts are supported');
                pointcut = {
                    type: +type,
                    phase,
                    annotation: AnnotationRef.of(match.groups.annotation),
                    name: match.groups.name,
                };

                Reflect.defineProperty(pointcut, Symbol.toPrimitive, {
                    value: () => `${phase}(${expStr})`,
                });
            }
        }
        assert(!!pointcut, `expression ${expStr} not recognized as valid pointcut expression`);
        return pointcut;
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
