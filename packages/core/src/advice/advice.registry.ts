import type { Pointcut } from '../pointcut/pointcut';
import type { AdviceType } from '../pointcut/pointcut-phase.type';
import type { PointcutTargetType } from '../pointcut/pointcut-target.type';
import type { Advice } from './advice.type';

export class AdviceRegistry {
  private readonly _advices: {
    [k in PointcutTargetType]?: {
      [k in AdviceType]?: Advice[];
    };
  } = {};

  register(pointcut: Pointcut, ...advices: Advice[]) {
    const byType = (this._advices[pointcut.type] =
      this._advices[pointcut.type] ?? {});

    const byPhase = (byType[pointcut.adviceType] =
      byType[pointcut.adviceType] ?? []);

    byPhase.push(...advices);
  }
}
