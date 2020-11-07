import { AdviceType } from '../../advice/types';
import { ClassAdviceTarget } from '../target/annotation-target';
import { ClassAnnotationLocation } from './annotation-location';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { getProto } from '../../utils/utils';

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
}
