import {
    AnnotationTarget,
    ClassAdviceTarget,
    ParameterAdviceTarget,
    PropertyAdviceTarget,
} from '../target/annotation-target';
import { assert, getOrDefault, getProto } from '../../utils';
import { AdviceTargetFactory } from '../target/advice-target-factory';
import { AnnotationType } from '../annotation.types';

export abstract class AnnotationLocationFactory {
    static create<T, A extends AnnotationType>(dtarget: Partial<AnnotationTarget<T, A>>): AnnotationLocation<T, A> {
        // get the rootTarget (the target of the class) for this target
        const rootTarget = dtarget.declaringClass;

        assert((dtarget.type === AnnotationType.CLASS) === ((rootTarget as any) === dtarget));

        // retrieve the declaringClass location (location of the declaringClass target)
        const rootLocation = getOrDefault(rootTarget, 'location', () => _createLocation(rootTarget)); // if no rootLocation exists, create a new one.

        if (dtarget.type === AnnotationType.CLASS) {
            return rootLocation as AnnotationLocation<T, A>;
        } else {
            // add a new location to the declaringClass location if it does not exists
            if (dtarget.type === AnnotationType.PROPERTY) {
                return getOrDefault(
                    rootLocation as any,
                    ((dtarget as any) as PropertyAdviceTarget<T>).propertyKey,
                    () => _createLocation(dtarget),
                );
            } else {
                const pdtarget = (dtarget as any) as PropertyAdviceTarget<T>;
                const methodLocation = getOrDefault(rootLocation as any, pdtarget.propertyKey, () => {
                    const methodTarget = AdviceTargetFactory.create(
                        {
                            proto: pdtarget.proto,
                            propertyKey: pdtarget.propertyKey,
                            descriptor: Object.getOwnPropertyDescriptor(pdtarget.proto, pdtarget.propertyKey) as any,
                            location: new AdviceLocationImpl() as any,
                        },
                        AnnotationType.METHOD,
                    );

                    const ml = _createLocation(methodTarget, methodTarget.location) as MethodAnnotationLocation<T>;

                    // if type = argument, ensure method loc already exists
                    getOrDefault(ml, 'args', () => {
                        const argsTarget = AdviceTargetFactory.create({
                            proto: dtarget.proto,
                            propertyKey: pdtarget.propertyKey,
                            parameterIndex: NaN as any,
                            location: [] as any,
                        });

                        return _createLocation(argsTarget) as any;
                    });

                    return ml;
                });

                if (dtarget.type === AnnotationType.METHOD) {
                    return methodLocation as MethodAnnotationLocation<T>;
                } else {
                    return getOrDefault(
                        methodLocation.args,
                        ((dtarget as any) as ParameterAdviceTarget<T>).parameterIndex,
                        () => _createLocation(dtarget) as ParameterAnnotationLocation<T>,
                    );
                }
            }
        }
    }

    static of<T>(obj: (new () => T) | T): AnnotationLocation<T, AnnotationType.CLASS> {
        const proto = getProto(obj);
        if (proto === Object.prototype) {
            throw new Error('given object is neither a constructor nor a class instance');
        }

        const target = AdviceTargetFactory.create({
            proto,
            type: AnnotationType.CLASS,
        }).declaringClass as ClassAdviceTarget<T>;

        return target.location;
    }

    static getTarget<T, A extends AnnotationType>(loc: AnnotationLocation<T, A>): AnnotationTarget<any, A> {
        return loc ? Object.getPrototypeOf(loc).getTarget() : undefined;
    }
}

function _createLocation<T, D extends AnnotationType>(
    target: Partial<AnnotationTarget<T, AnnotationType>>,
    locationStub: any = new AdviceLocationImpl(),
): AnnotationLocation<T, D> {
    const proto = Object.create(Reflect.getPrototypeOf(locationStub));
    proto.getTarget = () => {
        return target;
    };

    Reflect.setPrototypeOf(locationStub, proto);

    return (locationStub as any) as AnnotationLocation<T, D>;
}

class AdviceLocationImpl<T, D extends AnnotationType> {
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

export type ClassAnnotationLocation<T> = AnnotationLocation<T, AnnotationType.CLASS>;
export type MethodAnnotationLocation<T> = AnnotationLocation<T, AnnotationType.METHOD> & {
    args: ParameterAnnotationLocation<T> & ParameterAnnotationLocation<T>[];
};
export type PropertyAnnotationLocation<T> = AnnotationLocation<T, AnnotationType.PROPERTY>;
export type ParameterAnnotationLocation<T> = AnnotationLocation<T, AnnotationType.PARAMETER>;
