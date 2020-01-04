import {
    AnnotationType,
    ClassAnnotation,
    MethodAnnotation,
    ParameterAnnotation,
    PropertyAnnotation,
} from '../annotation.types';
import {
    AnnotationTarget,
    AnnotationTargetType,
    ClassAnnotationTarget,
    ParameterAnnotationTarget,
    PropertyAnnotationTarget,
} from '../target/annotation-target';
import { assert, getOrDefault, getProto } from '../../utils';
import { AnnotationTargetFactory } from '../target/annotation-target-factory';

export abstract class AnnotationLocationFactory {
    static create<T, D extends AnnotationType>(dtarget: Partial<AnnotationTarget<T, D>>): AnnotationLocation<T, D> {
        // get the rootTarget (the target of the class) for this target
        const rootTarget = dtarget.declaringClass;

        assert((dtarget.type === AnnotationTargetType.CLASS) === ((rootTarget as any) === dtarget));

        // retrieve the declaringClass location (location of the declaringClass target)
        const rootLocation = getOrDefault(rootTarget, 'location', () => _createLocation(rootTarget)); // if no rootLocation exists, create a new one.

        if (dtarget.type === AnnotationTargetType.CLASS) {
            return rootLocation as AnnotationLocation<T, D>;
        } else {
            // add a new location to the declaringClass location if it does not exists
            if (dtarget.type === AnnotationTargetType.PROPERTY) {
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
                        AnnotationTargetType.METHOD,
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

                if (dtarget.type === AnnotationTargetType.METHOD) {
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

    static of<T>(obj: (new () => T) | T): AnnotationLocation<T, ClassAnnotation> {
        const proto = getProto(obj);
        if (proto === Object.prototype) {
            throw new Error('given object is neither a constructor nor a class instance');
        }

        const target = AnnotationTargetFactory.create({
            proto,
            type: AnnotationTargetType.CLASS,
        }).declaringClass as ClassAnnotationTarget<T>;

        return target.location;
    }

    static getTarget(loc: AnnotationLocation<any, AnnotationType>) {
        return loc ? Object.getPrototypeOf(loc).getTarget() : undefined;
    }
}

function _createLocation<T, D extends AnnotationType>(
    target: Partial<AnnotationTarget<T, AnnotationType>>,
    locationStub: any = new AnnotationLocationImpl(),
): AnnotationLocation<T, D> {
    const proto = Object.create(Reflect.getPrototypeOf(locationStub));
    proto.getTarget = () => {
        return target;
    };

    Reflect.setPrototypeOf(locationStub, proto);

    return (locationStub as any) as AnnotationLocation<T, D>;
}

class AnnotationLocationImpl<T, D extends AnnotationType> {
    getTarget(): AnnotationTarget<T, AnnotationType> {
        throw new Error('No target registered');
    }
}

export namespace AnnotationLocation {
    export const of = AnnotationLocationFactory.of;
    export const create = AnnotationLocationFactory.create;
    export const getTarget = AnnotationLocationFactory.getTarget;
}

export type AnnotationLocation<T, D extends AnnotationType> =
    | undefined
    | {
          [prop in keyof T]: T[prop] extends (...any: any[]) => any
              ? MethodAnnotationLocation<T>
              : AnnotationLocation<T, any>;
      };

export type ClassAnnotationLocation<T> = AnnotationLocation<T, ClassAnnotation>;
export type MethodAnnotationLocation<T> = AnnotationLocation<T, MethodAnnotation> & {
    args: ParameterAnnotationLocation<T> & ParameterAnnotationLocation<T>[];
};
export type PropertyAnnotationLocation<T> = AnnotationLocation<T, PropertyAnnotation>;
export type ParameterAnnotationLocation<T> = AnnotationLocation<T, ParameterAnnotation>;
