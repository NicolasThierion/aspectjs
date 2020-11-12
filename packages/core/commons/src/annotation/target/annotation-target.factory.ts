import {
    assert,
    getOrComputeMetadata,
    getProto,
    isFunction,
    isNumber,
    isObject,
    isUndefined,
    locator,
} from '@aspectjs/core/utils';
import {
    AnnotationTarget,
    AdviceTarget,
    ClassAdviceTarget,
    MethodAdviceTarget,
    ParameterAdviceTarget,
    PropertyAdviceTarget,
} from './annotation-target';
import { _getReferenceConstructor, Mutable } from '@aspectjs/core/utils';
import { AdviceType } from '../../advices/types';
import { AnnotationLocation, MethodAnnotationLocation } from '../location/annotation-location';
import { AnnotationType } from '../annotation.types';

const TARGET_GENERATORS = {
    [AdviceType.CLASS]: _createClassAnnotationTarget,
    [AdviceType.PROPERTY]: _createPropertyAnnotationTarget,
    [AdviceType.METHOD]: _createMethodAnnotationTarget,
    [AdviceType.PARAMETER]: _createParameterAnnotationTarget,
};

let globalTargetId = 0;

const REF_GENERATORS = {
    [AdviceType.CLASS]: (d: Mutable<Partial<ClassAdviceTarget<any>>>) =>
        `c[${_getReferenceConstructor(d.proto).name}]#${getOrComputeMetadata(
            'aspectjs.targetId',
            d.proto,
            () => globalTargetId++,
        )}`,
    [AdviceType.PROPERTY]: (d: Mutable<Partial<PropertyAdviceTarget<any>>>) =>
        `c[${_getReferenceConstructor(d.proto).name}].p[${d.propertyKey}]#${getOrComputeMetadata(
            'aspectjs.targetId',
            d.proto,
            () => globalTargetId++,
        )}`,
    [AdviceType.METHOD]: (d: Mutable<Partial<MethodAdviceTarget<any>>>) =>
        `c[${_getReferenceConstructor(d.proto).name}].p[${d.propertyKey}]#${getOrComputeMetadata(
            'aspectjs.targetId',
            d.proto,
            () => globalTargetId++,
        )}`,
    [AdviceType.PARAMETER]: (d: Mutable<Partial<ParameterAdviceTarget<any>>>) =>
        `c[${_getReferenceConstructor(d.proto).name}].p[${d.propertyKey}].a[${
            isNaN(d.parameterIndex) ? '*' : d.parameterIndex
        }]#${getOrComputeMetadata('aspectjs.targetId', d.proto, () => globalTargetId++)}`,
};

/**
 * @public
 */
export class AnnotationTargetFactory {
    of<T, A extends AdviceType>(args: any[]): AdviceTarget<T, A> {
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
        const atarget: MutableAdviceTarget<any, AdviceType> = {
            proto,
            propertyKey,
            parameterIndex,
            descriptor,
        };

        return this.create(atarget as any);
    }

    /**
     * Creates an AnnotationTarget from the given argument
     * @param target - the AnnotationTarget stub.
     * @param type - target type override
     */
    create<T, A extends AdviceType>(target: MutableAdviceTarget<T, A>, type?: AdviceType): AdviceTarget<T, A> {
        // determine advice type
        if (isUndefined(type) && isUndefined(target.type)) {
            if (isNumber(((target as any) as ParameterAdviceTarget<T>).parameterIndex)) {
                type = AdviceType.PARAMETER;
            } else if (!isUndefined(target.propertyKey)) {
                if (isObject(target.descriptor) && isFunction(target.descriptor.value)) {
                    type = AdviceType.METHOD;
                } else {
                    type = AdviceType.PROPERTY;
                }
            } else {
                type = AdviceType.CLASS;
            }
        } else {
            type = type ?? target.type;
        }

        const ref = REF_GENERATORS[type](target as any);
        target.type = type as A;
        return getOrComputeMetadata(_metaKey(ref), target.proto, () => {
            const t = (TARGET_GENERATORS[type] as any)(this, target as any);
            Reflect.setPrototypeOf(t, AnnotationTargetImpl.prototype);

            return t;
        }) as any;
    }

    getTarget<T>(location: AnnotationLocation<T>): AnnotationTarget<T> {
        if (!location) {
            return undefined;
        }
        return Object.getPrototypeOf(location).getTarget();
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

/**
 * @public
 */
export type MutableAdviceTarget<T, A extends AdviceType> = Mutable<Partial<AdviceTarget<T, A>>>;

function _createClassAnnotationTarget<T, A extends AdviceType.CLASS>(
    targetFactory: AnnotationTargetFactory,
    target: AnnotationTargetLike<T, A>,
): AnnotationTargetLike<T, A> {
    target = _createAnnotationTarget(target, AdviceType.CLASS, ['proto']) as Mutable<Partial<AdviceTarget<T, A>>>;
    target.label = `class "${target.proto.constructor.name}"`;
    target.name = target.proto.constructor.name;
    target.declaringClass = target as any;

    target.location = target.location ?? _createLocation(target);

    const parentClass = _parentClassTargetProperty(targetFactory, target);
    Object.defineProperties(target, {
        parent: parentClass,
        parentClass,
    });

    return target as AdviceTarget<T, A>;
}

function _createMethodAnnotationTarget<T, D extends AdviceType.METHOD>(
    targetFactory: AnnotationTargetFactory,
    target: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    target = _createAnnotationTarget(target, AdviceType.METHOD, ['proto', 'propertyKey', 'descriptor']);

    target.label = `method "${target.proto.constructor.name}.${String(target.propertyKey)}"`;
    target.name = target.propertyKey;
    Object.defineProperties(target, {
        declaringClass: _declaringClassTargetProperty(targetFactory, target),
        parent: _declaringClassTargetProperty(targetFactory, target),
        parentClass: _parentClassTargetProperty(targetFactory, target),
    });

    if (!target.location) {
        target.location = locator(_getDeclaringClassLocation(target) as any)
            .at(target.propertyKey)
            .orElseCompute(() => _createLocation(target) as MethodAnnotationLocation<T>);

        target.location.args = _createAllParametersAnnotationTarget(targetFactory, target).location as any;
    }

    return target as AdviceTarget<T, D>;
}

function _getDeclaringClassLocation<T>(target: AnnotationTargetLike<T, AnnotationType>): AnnotationLocation<T> {
    // retrieve the declaringClass location (location of the declaringClass target)
    return locator(target.declaringClass)
        .at('location')
        .orElseCompute(() => _createLocation(target.declaringClass)); // if no rootLocation exists, create a new one.
}

function _createPropertyAnnotationTarget<T, D extends AdviceType.PROPERTY>(
    targetFactory: AnnotationTargetFactory,
    target: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    target = _createAnnotationTarget(target, AdviceType.PROPERTY, ['proto', 'propertyKey']);

    target.label = `property "${target.proto.constructor.name}.${String(target.propertyKey)}"`;
    Object.defineProperties(target, {
        declaringClass: _declaringClassTargetProperty(targetFactory, target),
        parent: _declaringClassTargetProperty(targetFactory, target),
        parentClass: _parentClassTargetProperty(targetFactory, target),
    });

    assert(target.type === AdviceType.PROPERTY);
    target.location =
        target.location ??
        locator(_getDeclaringClassLocation<T>(target) as any)
            .at(target.propertyKey)
            .orElseCompute(() => _createLocation(target));

    return target as AdviceTarget<T, D>;
}

function _createAllParametersAnnotationTarget<T, D extends AdviceType.PARAMETER | AdviceType.METHOD>(
    targetFactory: AnnotationTargetFactory,
    target: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    target = _createAnnotationTarget<T, D>({ ...target, parameterIndex: NaN as any }, AdviceType.PARAMETER, [
        'parameterIndex',
        'proto',
        'propertyKey',
    ]);
    target.label = `parameter "${target.proto.constructor.name}.${String(target.propertyKey)}(*)})"`;
    Object.defineProperties(target, {
        declaringClass: _declaringClassTargetProperty(targetFactory, target),
        parent: _declaringMethodTargetProperty(targetFactory, target),
        parentClass: _parentClassTargetProperty(targetFactory, target),
    });
    target.location = target.location ?? _createLocation(target, []);
    return target;
}
function _createParameterAnnotationTarget<T, D extends AdviceType.PARAMETER>(
    targetFactory: AnnotationTargetFactory,
    target: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    target = _createAnnotationTarget<T, D>(target, AdviceType.PARAMETER, ['parameterIndex', 'proto', 'propertyKey']);
    target.label = `parameter "${target.proto.constructor.name}.${String(target.propertyKey)}(#${
        target.parameterIndex
    })"`;
    Object.defineProperties(target, {
        declaringClass: _declaringClassTargetProperty(targetFactory, target),
        parent: _declaringMethodTargetProperty(targetFactory, target),
        parentClass: _parentClassTargetProperty(targetFactory, target),
    });
    if (!target.location) {
        const methodLocation = locator(_getDeclaringClassLocation(target) as any)
            .at(target.propertyKey)
            .orElseCompute(() => {
                return targetFactory.create(
                    {
                        proto: target.proto,
                        propertyKey: target.propertyKey,
                        descriptor: Object.getOwnPropertyDescriptor(target.proto, target.propertyKey) as any,
                    },
                    AdviceType.METHOD,
                ).location;
            });

        target.location = locator(methodLocation.args)
            .at(((target as any) as ParameterAdviceTarget<T>).parameterIndex)
            .orElseCompute(() => _createLocation(target));
    }
    target.descriptor = Reflect.getOwnPropertyDescriptor(target.proto, target.propertyKey) as any;

    return target;
}

function _createAnnotationTarget<T, D extends AdviceType>(
    target: AnnotationTargetLike<T, D>,
    type: AdviceType,
    requiredProperties: (keyof AdviceTarget<T, D>)[],
): AnnotationTargetLike<T, D> {
    requiredProperties.forEach((n) => assert(!isUndefined(target[n]), `target.${n} is undefined`));

    target = { ...target };

    // delete useleff properties
    Object.keys(target)
        .filter((p) => requiredProperties.indexOf(p as any) < 0)
        .forEach((n: keyof AnnotationTargetLike<T, D>) => delete target[n]);

    target.type = type as any;
    target.ref = target.ref ?? REF_GENERATORS[target.type](target as any);

    return target as AdviceTarget<T, D>;
}

type AnnotationTargetLike<T, D extends AdviceType> = Mutable<Partial<AdviceTarget<T, D>>>;

function _parentClassTargetProperty(
    targetFactory: AnnotationTargetFactory,
    dtarget: Partial<AdviceTarget<any, AdviceType>>,
): PropertyDescriptor {
    return {
        get() {
            const parentProto = Reflect.getPrototypeOf(dtarget.proto);
            return parentProto === Object.prototype
                ? undefined
                : (targetFactory.of([parentProto]) as ClassAdviceTarget<any>);
        },
    } as PropertyDescriptor;
}

function _declaringClassTargetProperty(
    targetFactory: AnnotationTargetFactory,
    dtarget: Partial<AdviceTarget<any, AdviceType>>,
): PropertyDescriptor {
    return {
        get() {
            return targetFactory.create({ ...dtarget }, AdviceType.CLASS);
        },
    } as PropertyDescriptor;
}

function _declaringMethodTargetProperty(
    targetFactory: AnnotationTargetFactory,
    dtarget: Partial<AdviceTarget<any, AdviceType>>,
): PropertyDescriptor {
    return {
        get() {
            return targetFactory.of([dtarget.proto, dtarget.propertyKey]) as any;
        },
    } as PropertyDescriptor;
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
