import { AnnotationRef } from '../..';
import { PointcutExpression } from '../advices/pointcut';
import { AnnotationTargetType } from '../../annotation/target/annotation-target';
import { WeavingError } from '../weaving-error';
import { assert } from '../../utils';

export enum PointcutPhase {
    COMPILE = 'compile',
    AROUND = 'around',
    BEFORE = 'before',
    AFTERRETURN = 'afterReturn',
    AFTER = 'after',
    AFTERTHROW = 'afterThrow',
}

export interface Pointcut {
    targetType: AnnotationTargetType;
    annotation: AnnotationRef;
    name: string;
    phase: PointcutPhase;
}

export namespace Pointcut {
    export function of(phase: PointcutPhase, exp: string): Pointcut;
    export function of(phase: PointcutPhase, exp: PointcutExpression): Pointcut;
    export function of(phase: PointcutPhase, exp: PointcutExpression | string): Pointcut {
        const expStr = exp.toString();
        const CLASS_REGEXP = new RegExp('(?:class#(?<class>\\S+?:\\S+?)(?:\\@(?<classAnnotation>\\S+?:\\S+)\\s*)?)');
        const match = CLASS_REGEXP.exec(expStr);

        let pointcut: Pointcut;
        if (match.groups.class) {
            assert(!!match.groups.classAnnotation);
            pointcut = {
                targetType: AnnotationTargetType.CLASS,
                phase,
                annotation: AnnotationRef.of(match.groups.classAnnotation),
                name: match.groups.class,
            };
        } else {
            throw new WeavingError('Only class-level aspects are supported at the moment');
        }

        Reflect.defineProperty(pointcut, Symbol.toPrimitive, {
            value: () => `${phase}(${expStr})`,
        });

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
