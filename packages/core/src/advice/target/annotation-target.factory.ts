import {
    assert,
    clone,
    getOrComputeMetadata,
    getProto,
    isFunction,
    isNumber,
    isObject,
    isUndefined,
} from '@aspectjs/core/utils';
import {
    AdviceLocation,
    AdviceTarget,
    ClassAdviceTarget,
    MethodAdviceTarget,
    MethodAnnotationLocation,
    ParameterAdviceTarget,
    PropertyAdviceTarget,
} from './advice-target';
import { AdviceType } from '../../annotation/annotation.types';
import { locator } from '../../utils/locator';
import { Mutable } from '../../utils/utils';

const TARGET_GENERATORS = {
    [AdviceType.CLASS]: _createClassAnnotationTarget,
    [AdviceType.PROPERTY]: _createPropertyAnnotationTarget,
    [AdviceType.METHOD]: _createMethodAnnotationTarget,
    [AdviceType.PARAMETER]: _createParameterAnnotationTarget,
};

let globalTargetId = 0;

const REF_GENERATORS = {
    [AdviceType.CLASS]: (d: Mutable<Partial<ClassAdviceTarget<any>>>) =>
        `c[${d.proto.constructor.name}]#${getOrComputeMetadata('aspectjs.targetId', d.proto, () => globalTargetId++)}`,
    [AdviceType.PROPERTY]: (d: Mutable<Partial<PropertyAdviceTarget<any>>>) =>
        `c[${d.proto.constructor.name}].p[${d.propertyKey}]#${getOrComputeMetadata(
            'aspectjs.targetId',
            d.proto,
            () => globalTargetId++,
        )}`,
    [AdviceType.METHOD]: (d: Mutable<Partial<MethodAdviceTarget<any>>>) =>
        `c[${d.proto.constructor.name}].p[${d.propertyKey}]#${getOrComputeMetadata(
            'aspectjs.targetId',
            d.proto,
            () => globalTargetId++,
        )}`,
    [AdviceType.PARAMETER]: (d: Mutable<Partial<ParameterAdviceTarget<any>>>) =>
        `c[${d.proto.constructor.name}].p[${d.propertyKey}].a[${d.parameterIndex}]#${getOrComputeMetadata(
            'aspectjs.targetId',
            d.proto,
            () => globalTargetId++,
        )}`,
};

export abstract class AnnotationTargetFactory {
    static of<T, A extends AdviceType>(args: any[]): AdviceTarget<T, A> {
        // ClassAnnotation = <TFunction extends Function>(target: TFunction) => TFunction | void;
        // PropertyAnnotation = (target: Object, propertyKey: string | symbol) => void;
        // MethodAnnotation = <A>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<A>) => TypedPropertyDescriptor<A> | void;
        // ParameterAnnotation = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;

        // eslint-disable-next-line @typescript-eslint/ban-types
        const target: Function | object = args[0];
        const propertyKey: string | undefined = isUndefined(args[1]) ? undefined : String(args[1]);
        const parameterIndex: number | undefined = isNumber(args[2]) ? args[2] : undefined;
        const proto = getProto(target);
        const descriptor: PropertyDescriptor | undefined = isObject(args[2]) ? args[2] : undefined;
        const atarget: MutableAnnotationTarget<any, AdviceType> = {
            proto,
            propertyKey,
            parameterIndex,
            descriptor,
        };

        return AnnotationTargetFactory.create(atarget as any);
    }

    /**
     * Creates a AdviceTarget corresponding to the given arguments
     * @param dtarget
     * @param type
     */
    static create<T, A extends AdviceType>(
        dtarget: MutableAnnotationTarget<T, A>,
        type?: AdviceType,
    ): AdviceTarget<T, A> {
        if (isUndefined(type) && isUndefined(dtarget.type)) {
            if (isNumber(((dtarget as any) as ParameterAdviceTarget<T>).parameterIndex)) {
                type = AdviceType.PARAMETER;
            } else if (!isUndefined(dtarget.propertyKey)) {
                if (isObject(dtarget.descriptor) && isFunction(dtarget.descriptor.value)) {
                    type = AdviceType.METHOD;
                } else {
                    type = AdviceType.PROPERTY;
                }
            } else {
                type = AdviceType.CLASS;
            }
        } else {
            type = type ?? dtarget.type;
        }

        const ref = REF_GENERATORS[type](dtarget as any);

        return getOrComputeMetadata(_metaKey(ref), dtarget.proto, () => {
            const target = (TARGET_GENERATORS[type] as any)(dtarget as any);
            Reflect.setPrototypeOf(target, AnnotationTargetImpl.prototype);

            return target;
        }) as any;
    }

    static atLocation<T, D extends AdviceType>(
        target: ClassAdviceTarget<T>,
        location: AdviceLocation<T, D>,
    ): AdviceTarget<T, D> {
        const srcTarget = AnnotationLocationFactory.getTarget(location);
        return AnnotationTargetFactory.create(
            Object.assign({}, srcTarget, {
                proto: target.declaringClass.proto,
            }),
        ) as AdviceTarget<T, D>;
    }
}

function _metaKey(ref: string): string {
    return `Decorizer.target:${ref}`;
}

class AnnotationTargetImpl {
    toString() {
        return ((this as any) as AdviceTarget<any, any>).ref;
    }
}

type MutableAnnotationTarget<T, A extends AdviceType> = Mutable<Partial<AdviceTarget<T, A>>>;

function _createClassAnnotationTarget<T, D extends AdviceType.CLASS>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget(dtarget, AdviceType.CLASS, ['proto']);

    d.label = `class "${d.proto.constructor.name}"`;
    d.name = d.proto.constructor.name;
    d.declaringClass = d as any;
    d.location = dtarget.location ?? AnnotationLocationFactory.create(d as any);
    Object.defineProperties(d, {
        parent: _parentClassTargetProperty(d),
        parentClass: _parentClassTargetProperty(d),
    });

    return d as AdviceTarget<T, D>;
}

function _createMethodAnnotationTarget<T, D extends AdviceType.METHOD>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const target = _createAnnotationTarget(dtarget, AdviceType.METHOD, ['proto', 'propertyKey', 'descriptor']);

    target.label = `method "${target.proto.constructor.name}.${String(target.propertyKey)}"`;
    target.name = target.propertyKey;
    Object.defineProperties(target, {
        declaringClass: _declaringClassTargetProperty(target),
        parent: _declaringClassTargetProperty(target),
        parentClass: _parentClassTargetProperty(target),
    });

    target.location = dtarget.location ?? AnnotationLocationFactory.create(target);

    return target as AdviceTarget<T, D>;
}

function _createPropertyAnnotationTarget<T, D extends AdviceType.PROPERTY>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget(dtarget, AdviceType.PROPERTY, ['proto', 'propertyKey']);

    d.label = `property "${d.proto.constructor.name}.${String(d.propertyKey)}"`;
    Object.defineProperties(d, {
        declaringClass: _declaringClassTargetProperty(d),
        parent: _declaringClassTargetProperty(d),
        parentClass: _parentClassTargetProperty(d),
    });
    d.location = dtarget.location ?? AnnotationLocationFactory.create(d as any);

    return d as AdviceTarget<T, D>;
}

function _createParameterAnnotationTarget<T, D extends AdviceType.PARAMETER>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget<T, D>(dtarget, AdviceType.PARAMETER, ['parameterIndex', 'proto', 'propertyKey']);

    d.label = `parameter "${d.proto.constructor.name}.${String(d.propertyKey)}(${
        isNaN(d.parameterIndex) ? '*' : `#${d.parameterIndex}`
    })"`;
    Object.defineProperties(d, {
        declaringClass: _declaringClassTargetProperty(d),
        parent: _declaringMethodTargetProperty(d),
        parentClass: _parentClassTargetProperty(d),
    });
    d.location = dtarget.location ?? AnnotationLocationFactory.create(d as any);
    d.descriptor = Reflect.getOwnPropertyDescriptor(d.proto, d.propertyKey) as any;

    return d as AdviceTarget<T, D>;
}

function _createAnnotationTarget<T, D extends AdviceType>(
    d: AnnotationTargetLike<T, D>,
    type: AdviceType,
    requiredProperties: (keyof AdviceTarget<T, D>)[],
): AnnotationTargetLike<T, D> {
    requiredProperties.forEach((n) => assert(!isUndefined(d[n]), `target.${n} is undefined`));

    d = clone(d);
    const uselessProperties = Object.keys(d).filter(
        (p) => requiredProperties.indexOf(p as any) < 0,
    ) as (keyof AdviceTarget<any, any>)[];

    uselessProperties.forEach((n) => delete d[n]);

    d.type = type as any;
    d.ref = d.ref ?? REF_GENERATORS[d.type](d as any);

    return d as AdviceTarget<T, D>;
}

type AnnotationTargetLike<T, D extends AdviceType> = Mutable<Partial<AdviceTarget<T, D>>>;

function _parentClassTargetProperty(dtarget: Partial<AdviceTarget<any, AdviceType>>): PropertyDescriptor {
    return {
        get() {
            const parentProto = Reflect.getPrototypeOf(dtarget.proto);
            return parentProto === Object.prototype
                ? undefined
                : (AnnotationTargetFactory.of([parentProto]) as ClassAdviceTarget<any>);
        },
    } as PropertyDescriptor;
}

function _declaringClassTargetProperty(dtarget: Partial<AdviceTarget<any, AdviceType>>): PropertyDescriptor {
    return {
        get() {
            return AnnotationTargetFactory.create(dtarget, AdviceType.CLASS);
        },
    } as PropertyDescriptor;
}

function _declaringMethodTargetProperty(dtarget: Partial<AdviceTarget<any, AdviceType>>): PropertyDescriptor {
    return {
        get() {
            return AnnotationTargetFactory.of([dtarget.proto, dtarget.propertyKey]) as any;
        },
    } as PropertyDescriptor;
}

export abstract class AnnotationLocationFactory {
    static create<T, A extends AdviceType>(dtarget: Partial<AdviceTarget<T, A>>): AdviceLocation<T, A> {
        // get the rootTarget (the target of the class) for this target
        const rootTarget = dtarget.declaringClass;

        assert((dtarget.type === AdviceType.CLASS) === ((rootTarget as any) === dtarget));

        // retrieve the declaringClass location (location of the declaringClass target)
        const rootLocation = locator(rootTarget)
            .at('location')
            .orElse(() => _createLocation(rootTarget)); // if no rootLocation exists, create a new one.

        if (dtarget.type === AdviceType.CLASS) {
            return rootLocation as AdviceLocation<T, A>;
        } else {
            // add a new location to the declaringClass location if it does not exists
            if (dtarget.type === AdviceType.PROPERTY) {
                return locator(rootLocation as any)
                    .at(dtarget.propertyKey)
                    .orElse(() => _createLocation(dtarget));
            } else {
                const pdtarget = (dtarget as any) as PropertyAdviceTarget<T>;
                const methodLocation = locator(rootLocation as any)
                    .at(pdtarget.propertyKey)
                    .orElse(() => {
                        const methodTarget = AnnotationTargetFactory.create(
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
                            .orElse(() => {
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
                    return locator(methodLocation.args)
                        .at(((dtarget as any) as ParameterAdviceTarget<T>).parameterIndex)
                        .orElse(() => _createLocation(dtarget));
                }
            }
        }
    }

    static of<T>(obj: (new () => T) | T): AdviceLocation<T, AdviceType.CLASS> {
        const proto = getProto(obj);
        if (proto === Object.prototype) {
            throw new Error('given object is neither a constructor nor a class instance');
        }

        const target = AnnotationTargetFactory.create({
            proto,
            type: AdviceType.CLASS,
        }).declaringClass as ClassAdviceTarget<T>;

        return target.location;
    }

    static getTarget<T, A extends AdviceType>(loc: AdviceLocation<T, A>): AdviceTarget<any, A> {
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
