import { AdviceType } from '../../advices/types';
import { AnnotationTarget, ClassAdviceTarget } from '../target/annotation-target';
import { AnnotationLocation, ClassAnnotationLocation } from './annotation-location';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { getProto } from '@aspectjs/core/utils';

/**
 * @public
 */
export class AnnotationLocationFactory {
    constructor(private _targetFactory: AnnotationTargetFactory) {}

    of<T>(obj: (new () => T) | T): ClassAnnotationLocation<T> {
        const proto = getProto(obj);
        if (proto === Object.prototype) {
            throw new Error('given object is neither a constructor nor a class instance');
        }

        const target = this._targetFactory.create({
            proto,
            type: AdviceType.CLASS,
        }).declaringClass as ClassAdviceTarget<T>;

        return target.location;
    }

    static getTarget<T>(location: AnnotationLocation<T>): AnnotationTarget<T> {
        if (!location) {
            return undefined;
        }
        return Object.getPrototypeOf(location).getTarget();
    }
}
