import { Annotation } from '../annotation.types';
import {
    AnnotationTarget,
    ClassAnnotationTarget,
    ParameterAnnotationTarget,
    PropertyAnnotationTarget,
} from '../target/annotation-target';
import { assert, getOrDefault, getProto } from '../../utils';
import { AnnotationTargetFactory } from '../target/annotation-target-factory';
import { AdviceType } from '../../weaver/advices/types';

export abstract class AnnotationLocationFactory {
    static create<T, D extends AdviceType>(dtarget: Partial<AnnotationTarget<T, D>>): AnnotationLocation<T, D> {
        // get the rootTarget (the target of the class) for this target
        const rootTarget = dtarget.declaringClass;

        assert((dtarget.type === AdviceType.CLASS) === ((rootTarget as any) === dtarget));

        // retrieve the declaringClass location (location of the declaringClass target)
        const rootLocation = getOrDefault(rootTarget, 'location', () => _createLocation(rootTarget)); // if no rootLocation exists, create a new one.

        if (dtarget.type === AdviceType.CLASS) {
            return rootLocation as AnnotationLocation<T, D>;
        } else {
            // add a new location to the declaringClass location if it does not exists
            if (dtarget.type === AdviceType.PROPERTY) {
                return getOrDefault(
                    rootLocation as any,
                    ((dtarget as any) as PropertyAnnotationTarget<T>).propertyKey,
                    () => _createLocation(dtarget),
                );
            } else {
                const pdtarget = (dtarget as any) as PropertyAnnotationTarget<T>;
                const methodLocation = getOrDefault(rootLocation as any, pdtarget.propertyKey, () => {
                    const methodTarget = AnnotationTargetFactory.create(
                        {
                            proto: pdtarget.proto,
                            propertyKey: pdtarget.propertyKey,
                            descriptor: Object.getOwnPropertyDescriptor(pdtarget.proto, pdtarget.propertyKey) as any,
                            location: new AnnotationLocationImpl() as any,
                        },
                        AdviceType.METHOD,
                    );

                    const ml = _createLocation(methodTarget, methodTarget.location) as MethodAnnotationLocation<T>;

                    // if type = argument, ensure method loc already exists
                    getOrDefault(ml, 'args', () => {
                        const argsTarget = AnnotationTargetFactory.create({
                            proto: dtarget.proto,
                            propertyKey: pdtarget.propertyKey,
                            parameterIndex: NaN as any,
                            location: [] as any,
                        });

                        return _createLocation(argsTarget) as any;
                    });

                    return ml;
                });

                if (dtarget.type === AdviceType.METHOD) {
                    return methodLocation as MethodAnnotationLocation<T>;
                } else {
                    return getOrDefault(
                        methodLocation.args,
                        ((dtarget as any) as ParameterAnnotationTarget<T>).parameterIndex,
                        () => _createLocation(dtarget) as ParameterAnnotationLocation<T>,
                    );
                }
            }
        }
    }

    static of<T>(obj: (new () => T) | T): AnnotationLocation<T, AdviceType.CLASS> {
        const proto = getProto(obj);
        if (proto === Object.prototype) {
            throw new Error('given object is neither a constructor nor a class instance');
        }

        const target = AnnotationTargetFactory.create({
            proto,
            type: AdviceType.CLASS,
        }).declaringClass as ClassAnnotationTarget<T>;

        return target.location;
    }

    static getTarget(loc: AnnotationLocation<any, AdviceType>) {
        return loc ? Object.getPrototypeOf(loc).getTarget() : undefined;
    }
}

function _createLocation<T, D extends AdviceType>(
    target: Partial<AnnotationTarget<T, AdviceType>>,
    locationStub: any = new AnnotationLocationImpl(),
): AnnotationLocation<T, D> {
    const proto = Object.create(Reflect.getPrototypeOf(locationStub));
    proto.getTarget = () => {
        return target;
    };

    Reflect.setPrototypeOf(locationStub, proto);

    return (locationStub as any) as AnnotationLocation<T, D>;
}

class AnnotationLocationImpl<T, D extends AdviceType> {
    getTarget(): AnnotationTarget<T, AdviceType> {
        throw new Error('No target registered');
    }
}

export namespace AnnotationLocation {
    export const of = AnnotationLocationFactory.of;
    export const create = AnnotationLocationFactory.create;
    export const getTarget = AnnotationLocationFactory.getTarget;
}

export type AnnotationLocation<T, D extends AdviceType> =
    | undefined
    | {
          [prop in keyof T]: T[prop] extends (...any: any[]) => any
              ? MethodAnnotationLocation<T>
              : AnnotationLocation<T, any>;
      };

export type ClassAnnotationLocation<T> = AnnotationLocation<T, AdviceType.CLASS>;
export type MethodAnnotationLocation<T> = AnnotationLocation<T, AdviceType.METHOD> & {
    args: ParameterAnnotationLocation<T> & ParameterAnnotationLocation<T>[];
};
export type PropertyAnnotationLocation<T> = AnnotationLocation<T, AdviceType.PROPERTY>;
export type ParameterAnnotationLocation<T> = AnnotationLocation<T, AdviceType.PARAMETER>;
