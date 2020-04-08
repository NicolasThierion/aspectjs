import {
    assert,
    clone,
    getMetaOrDefault,
    getOrDefault,
    getProto,
    isNumber,
    isObject,
    isUndefined,
    Mutable,
} from '../../utils';
import {
    AnnotationLocation,
    AnnotationTarget,
    ClassAdviceTarget,
    MethodAdviceTarget,
    MethodAnnotationLocation,
    ParameterAdviceTarget,
    ParameterAnnotationLocation,
    PropertyAdviceTarget,
} from './annotation-target';
import { AnnotationType } from '../annotation.types';

const TARGET_GENERATORS = {
    [AnnotationType.CLASS]: _createClassAnnotationTarget,
    [AnnotationType.PROPERTY]: _createPropertyAnnotationTarget,
    [AnnotationType.METHOD]: _createMethodAnnotationTarget,
    [AnnotationType.PARAMETER]: _createParameterAnnotationTarget,
};

const REF_GENERATORS = {
    [AnnotationType.CLASS]: (d: Mutable<Partial<ClassAdviceTarget<any>>>) => `c[${d.proto.constructor.name}]`,
    [AnnotationType.PROPERTY]: (d: Mutable<Partial<PropertyAdviceTarget<any>>>) =>
        `c[${d.proto.constructor.name}].p[${d.propertyKey}]`,
    [AnnotationType.METHOD]: (d: Mutable<Partial<MethodAdviceTarget<any>>>) =>
        `c[${d.proto.constructor.name}].p[${d.propertyKey}]`,
    [AnnotationType.PARAMETER]: (d: Mutable<Partial<ParameterAdviceTarget<any>>>) =>
        `c[${d.proto.constructor.name}].p[${d.propertyKey}].a[${d.parameterIndex}]`,
};

export abstract class AnnotationTargetFactory {
    static of<T, A extends AnnotationType>(args: any[]): AnnotationTarget<T, A> {
        // ClassAnnotation = <TFunction extends Function>(target: TFunction) => TFunction | void;
        // PropertyAnnotation = (target: Object, propertyKey: string | symbol) => void;
        // MethodAnnotation = <A>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<A>) => TypedPropertyDescriptor<A> | void;
        // ParameterAnnotation = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;

        const target: Function | object = args[0];
        const propertyKey: string | undefined = isUndefined(args[1]) ? undefined : String(args[1]);
        const parameterIndex: number | undefined = isNumber(args[2]) ? args[2] : undefined;
        const proto = getProto(target);
        const descriptor: object | undefined = isObject(args[2]) ? args[2] : undefined;
        const atarget: MutableAnnotationTarget<any, AnnotationType> = {
            proto,
            propertyKey,
            parameterIndex,
            descriptor,
        };

        return AnnotationTargetFactory.create(atarget as any);
    }

    /**
     * Creates a AnnotationTarget corresponding to the given arguments
     * @param dtarget
     * @param type
     */
    static create<T, A extends AnnotationType>(
        dtarget: MutableAnnotationTarget<T, A>,
        type?: AnnotationType,
    ): AnnotationTarget<T, A> {
        if (isUndefined(type) && isUndefined(dtarget.type)) {
            if (isNumber(((dtarget as any) as ParameterAdviceTarget<T>).parameterIndex)) {
                type = AnnotationType.PARAMETER;
            } else if (!isUndefined(((dtarget as any) as MethodAdviceTarget<T>).propertyKey)) {
                if (isObject(((dtarget as any) as MethodAdviceTarget<T>).descriptor)) {
                    type = AnnotationType.METHOD;
                } else {
                    type = AnnotationType.PROPERTY;
                }
            } else {
                type = AnnotationType.CLASS;
            }
        } else {
            type = type ?? dtarget.type;
        }

        const ref = REF_GENERATORS[type](dtarget as any);

        return getMetaOrDefault(_metaKey(ref), dtarget.proto, () => {
            const target = (TARGET_GENERATORS[type] as any)(dtarget as any);
            Reflect.setPrototypeOf(target, AnnotationTargetImpl.prototype);

            return target;
        }) as any;
    }

    static atLocation<T, D extends AnnotationType>(
        target: ClassAdviceTarget<T>,
        location: AnnotationLocation<T, D>,
    ): AnnotationTarget<T, D> {
        const srcTarget = AnnotationLocationFactory.getTarget(location);
        return AnnotationTargetFactory.create(
            Object.assign({}, srcTarget, {
                proto: target.declaringClass.proto,
            }),
        ) as AnnotationTarget<T, D>;
    }
}

function _metaKey(ref: string): string {
    return `Decorizer.target:${ref}`;
}

class AnnotationTargetImpl {
    toString() {
        return ((this as any) as AnnotationTarget<any, any>).ref;
    }
}

type MutableAnnotationTarget<T, A extends AnnotationType> = Mutable<Partial<AnnotationTarget<T, A>>>;

function _createClassAnnotationTarget<T, D extends AnnotationType.CLASS>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget(dtarget, AnnotationType.CLASS, ['proto']);

    d.label = `class "${d.proto.constructor.name}"`;
    d.name = d.proto.constructor.name;
    d.declaringClass = d as any;
    d.location = dtarget.location ?? AnnotationLocationFactory.create(d as any);
    Object.defineProperties(d, {
        parent: _parentClassTargetProperty(d),
        parentClass: _parentClassTargetProperty(d),
    });

    return d as AnnotationTarget<T, D>;
}

function _createMethodAnnotationTarget<T, D extends AnnotationType.METHOD>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const target = _createAnnotationTarget(dtarget, AnnotationType.METHOD, ['proto', 'propertyKey', 'descriptor']);

    target.label = `method "${target.proto.constructor.name}.${String(target.propertyKey)}"`;
    target.name = target.propertyKey;
    Object.defineProperties(target, {
        declaringClass: _declaringClassTargetProperty(target),
        parent: _declaringClassTargetProperty(target),
        parentClass: _parentClassTargetProperty(target),
    });

    target.location = dtarget.location ?? AnnotationLocationFactory.create(target);

    return target as AnnotationTarget<T, D>;
}

function _createPropertyAnnotationTarget<T, D extends AnnotationType.PROPERTY>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget(dtarget, AnnotationType.PROPERTY, ['proto', 'propertyKey']);

    d.label = `property "${d.proto.constructor.name}.${String(d.propertyKey)}"`;
    Object.defineProperties(d, {
        declaringClass: _declaringClassTargetProperty(d),
        parent: _declaringClassTargetProperty(d),
        parentClass: _parentClassTargetProperty(d),
    });
    d.location = dtarget.location ?? AnnotationLocationFactory.create(d as any);

    return d as AnnotationTarget<T, D>;
}

function _createParameterAnnotationTarget<T, D extends AnnotationType.PARAMETER>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget<T, D>(dtarget, AnnotationType.PARAMETER, [
        'parameterIndex',
        'proto',
        'propertyKey',
    ]);

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

    return d as AnnotationTarget<T, D>;
}

function _createAnnotationTarget<T, D extends AnnotationType>(
    d: AnnotationTargetLike<T, D>,
    type: AnnotationType,
    requiredProperties: (keyof AnnotationTarget<T, D>)[],
): AnnotationTargetLike<T, D> {
    requiredProperties.forEach(n => assert(!isUndefined(d[n]), `target.${n} is undefined`));

    d = clone(d);
    const uselessProperties = Object.keys(d).filter(
        p => requiredProperties.indexOf(p as any) < 0,
    ) as (keyof AnnotationTarget<any, any>)[];

    uselessProperties.forEach(n => delete d[n]);

    d.type = type as any;
    d.ref = d.ref ?? REF_GENERATORS[d.type](d as any);

    return d as AnnotationTarget<T, D>;
}

type AnnotationTargetLike<T, D extends AnnotationType> = Mutable<Partial<AnnotationTarget<T, D>>>;

function _parentClassTargetProperty(dtarget: Partial<AnnotationTarget<any, AnnotationType>>): PropertyDescriptor {
    return {
        get() {
            const parentProto = Reflect.getPrototypeOf(dtarget.proto);
            return parentProto === Object.prototype
                ? undefined
                : (AnnotationTargetFactory.of([parentProto]) as ClassAdviceTarget<any>);
        },
    } as PropertyDescriptor;
}

function _declaringClassTargetProperty(dtarget: Partial<AnnotationTarget<any, AnnotationType>>): PropertyDescriptor {
    return {
        get() {
            return AnnotationTargetFactory.create(dtarget, AnnotationType.CLASS);
        },
    } as PropertyDescriptor;
}

function _declaringMethodTargetProperty(dtarget: Partial<AnnotationTarget<any, AnnotationType>>): PropertyDescriptor {
    return {
        get() {
            return AnnotationTargetFactory.of([dtarget.proto, dtarget.propertyKey]) as any;
        },
    } as PropertyDescriptor;
}

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
                    const methodTarget = AnnotationTargetFactory.create(
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

        const target = AnnotationTargetFactory.create({
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
