import { AdviceTarget, ClassAdviceTarget, ParameterAdviceTarget, PropertyAdviceTarget } from '../target/advice-target';
import { assert, getOrDefault, getProto } from '../../utils';
import { AdviceTargetFactory } from '../target/advice-target-factory';
import { AdviceType } from '../../weaver/advices/types';

export abstract class AdviceLocationFactory {
    static create<T, D extends AdviceType>(dtarget: Partial<AdviceTarget<T, D>>): AdviceLocation<T, D> {
        // get the rootTarget (the target of the class) for this target
        const rootTarget = dtarget.declaringClass;

        assert((dtarget.type === AdviceType.CLASS) === ((rootTarget as any) === dtarget));

        // retrieve the declaringClass location (location of the declaringClass target)
        const rootLocation = getOrDefault(rootTarget, 'location', () => _createLocation(rootTarget)); // if no rootLocation exists, create a new one.

        if (dtarget.type === AdviceType.CLASS) {
            return rootLocation as AdviceLocation<T, D>;
        } else {
            // add a new location to the declaringClass location if it does not exists
            if (dtarget.type === AdviceType.PROPERTY) {
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
                        AdviceType.METHOD,
                    );

                    const ml = _createLocation(methodTarget, methodTarget.location) as MethodAdviceLocation<T>;

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

                if (dtarget.type === AdviceType.METHOD) {
                    return methodLocation as MethodAdviceLocation<T>;
                } else {
                    return getOrDefault(
                        methodLocation.args,
                        ((dtarget as any) as ParameterAdviceTarget<T>).parameterIndex,
                        () => _createLocation(dtarget) as ParameterAdviceLocation<T>,
                    );
                }
            }
        }
    }

    static of<T>(obj: (new () => T) | T): AdviceLocation<T, AdviceType.CLASS> {
        const proto = getProto(obj);
        if (proto === Object.prototype) {
            throw new Error('given object is neither a constructor nor a class instance');
        }

        const target = AdviceTargetFactory.create({
            proto,
            type: AdviceType.CLASS,
        }).declaringClass as ClassAdviceTarget<T>;

        return target.location;
    }

    static getTarget(loc: AdviceLocation<any, AdviceType>) {
        return loc ? Object.getPrototypeOf(loc).getTarget() : undefined;
    }
}

function _createLocation<T, D extends AdviceType>(
    target: Partial<AdviceTarget<T, AdviceType>>,
    locationStub: any = new AdviceLocationImpl(),
): AdviceLocation<T, D> {
    const proto = Object.create(Reflect.getPrototypeOf(locationStub));
    proto.getTarget = () => {
        return target;
    };

    Reflect.setPrototypeOf(locationStub, proto);

    return (locationStub as any) as AdviceLocation<T, D>;
}

class AdviceLocationImpl<T, D extends AdviceType> {
    getTarget(): AdviceTarget<T, AdviceType> {
        throw new Error('No target registered');
    }
}

export namespace AdviceLocation {
    export const of = AdviceLocationFactory.of;
    export const create = AdviceLocationFactory.create;
    export const getTarget = AdviceLocationFactory.getTarget;
}

export type AdviceLocation<T, D extends AdviceType> =
    | undefined
    | {
          [prop in keyof T]: T[prop] extends (...any: any[]) => any ? MethodAdviceLocation<T> : AdviceLocation<T, any>;
      };

export type ClassAdviceLocation<T> = AdviceLocation<T, AdviceType.CLASS>;
export type MethodAdviceLocation<T> = AdviceLocation<T, AdviceType.METHOD> & {
    args: ParameterAdviceLocation<T> & ParameterAdviceLocation<T>[];
};
export type PropertyAdviceLocation<T> = AdviceLocation<T, AdviceType.PROPERTY>;
export type ParameterAdviceLocation<T> = AdviceLocation<T, AdviceType.PARAMETER>;
