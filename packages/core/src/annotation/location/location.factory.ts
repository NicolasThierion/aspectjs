import { AdviceType } from '../../advice/types';
import {
    AdviceTarget,
    AnnotationTarget,
    ClassAdviceTarget,
    ParameterAdviceTarget,
    PropertyAdviceTarget,
} from '../target/annotation-target';
import { AnnotationLocation, ClassAnnotationLocation, MethodAnnotationLocation } from './annotation-location';
import { locator } from '../../utils/locator';
import { AnnotationType } from '../annotation.types';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { assert, getProto } from '@aspectjs/core/utils';

export class AnnotationLocationFactory {
    constructor(private _targetFactory: AnnotationTargetFactory) {}

    create<T, A extends AdviceType>(dtarget: Partial<AdviceTarget<T, A>>): AnnotationLocation<T, A> {
        // get the rootTarget (the target of the class) for this target
        const rootTarget = dtarget.declaringClass;

        assert((dtarget.type === AdviceType.CLASS) === ((rootTarget as any) === dtarget));

        // retrieve the declaringClass location (location of the declaringClass target)
        const rootLocation = locator(rootTarget)
            .at('location')
            .orElseCompute(() => _createLocation(rootTarget)); // if no rootLocation exists, create a new one.

        if (dtarget.type === AdviceType.CLASS) {
            return rootLocation as AnnotationLocation<T, A>;
        } else {
            // add a new location to the declaringClass location if it does not exists
            if (dtarget.type === AdviceType.PROPERTY) {
                return locator(rootLocation as any)
                    .at(dtarget.propertyKey)
                    .orElseCompute(() => _createLocation(dtarget));
            } else {
                const pdtarget = (dtarget as any) as PropertyAdviceTarget<T>;
                const methodLocation = locator(rootLocation as any)
                    .at(pdtarget.propertyKey)
                    .orElseCompute(() => {
                        const methodTarget = this._targetFactory.create(
                            {
                                proto: pdtarget.proto,
                                propertyKey: pdtarget.propertyKey,
                                descriptor: Object.getOwnPropertyDescriptor(
                                    pdtarget.proto,
                                    pdtarget.propertyKey,
                                ) as any,
                                location: new AdviceLocationImpl() as any,
                            },
                            AdviceType.METHOD,
                        );

                        const ml = _createLocation(methodTarget, methodTarget.location) as MethodAnnotationLocation<T>;

                        // if type = argument, ensure method loc already exists
                        locator(ml)
                            .at('args')
                            .orElseCompute(() => {
                                const argsTarget = this._targetFactory.create({
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
                    return methodLocation;
                } else {
                    return locator(methodLocation.args)
                        .at(((dtarget as any) as ParameterAdviceTarget<T>).parameterIndex)
                        .orElseCompute(() => _createLocation(dtarget));
                }
            }
        }
    }

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

    getTarget(location: AnnotationLocation): AnnotationTarget {
        if (!location) {
            return undefined;
        }
        return Object.getPrototypeOf(location).getTarget();
    }
}

function _createLocation<T, A extends AnnotationType>(
    target: Partial<AdviceTarget<T, A>>,
    locationStub: any = new AdviceLocationImpl(),
): AnnotationLocation<T, A> {
    const proto = Object.create(Reflect.getPrototypeOf(locationStub));
    proto.getTarget = () => {
        return target;
    };

    Reflect.setPrototypeOf(locationStub, proto);

    return locationStub as AnnotationLocation<T, A>;
}

class AdviceLocationImpl<T, D extends AdviceType> {
    getTarget(): AdviceTarget<T, AdviceType> {
        throw new Error('No target registered');
    }
}
