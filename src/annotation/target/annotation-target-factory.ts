import { ClassAnnotation, MethodAnnotation, ParameterAnnotation, PropertyAnnotation } from '../annotation.types';
import {
    assert,
    clone,
    getMetaOrDefault,
    getProto,
    isNumber,
    isObject,
    isUndefined,
    Mutable,
} from '../../../src.old/utils';
import { AnnotationType } from '../annotation.types';
import { AnnotationLocation } from '../location/location';
import {
    AnnotationTarget,
    AnnotationTargetType,
    ClassAnnotationTarget,
    MethodAnnotationTarget,
    ParameterAnnotationTarget,
    PropertyAnnotationTarget,
} from './annotation-target';

const TARGET_GENERATORS = [
    _createClassAnnotationTarget,
    _createPropertyAnnotationTarget,
    _createMethodAnnotationTarget,
    _createParameterAnnotationTarget,
];

const REF_GENERATORS = [
    (d: Mutable<Partial<AnnotationTarget<any, AnnotationType>>>) => `c[${d.proto.constructor.name}]`,
    (d: Mutable<Partial<PropertyAnnotationTarget<any>>>) => `c[${d.proto.constructor.name}].p[${d.propertyKey}]`,
    (d: Mutable<Partial<MethodAnnotationTarget<any>>>) => `c[${d.proto.constructor.name}].p[${d.propertyKey}]`,
    (d: Mutable<Partial<ParameterAnnotationTarget<any>>>) =>
        `c[${d.proto.constructor.name}].p[${d.propertyKey}].a[${d.parameterIndex}]`,
];

export abstract class AnnotationTargetFactory {
    static of<T, D extends AnnotationType>(args: any[]): AnnotationTarget<T, D> {
        // ClassAnnotation = <TFunction extends Function>(target: TFunction) => TFunction | void;
        // PropertyAnnotation = (target: Object, propertyKey: string | symbol) => void;
        // MethodAnnotation = <D>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<D>) => TypedPropertyDescriptor<D> | void;
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
     * @param targetType
     */
    static create<T, D extends AnnotationType>(
        dtarget: MutableAnnotationTarget<T, D>,
        targetType?: AnnotationTargetType,
    ): AnnotationTarget<T, D> {
        if (isUndefined(targetType) && isUndefined(dtarget.type)) {
            if (isNumber(((dtarget as any) as ParameterAnnotationTarget<T>).parameterIndex)) {
                targetType = AnnotationTargetType.PARAMETER;
            } else if (!isUndefined(((dtarget as any) as MethodAnnotationTarget<T>).propertyKey)) {
                if (isObject(((dtarget as any) as MethodAnnotationTarget<T>).descriptor)) {
                    targetType = AnnotationTargetType.METHOD;
                } else {
                    targetType = AnnotationTargetType.PROPERTY;
                }
            } else {
                targetType = AnnotationTargetType.CLASS;
            }
        } else {
            targetType = targetType ?? dtarget.type;
        }

        const ref = REF_GENERATORS[targetType](dtarget as any);

        return getMetaOrDefault(_metaKey(ref), dtarget.proto, () => {
            const target = TARGET_GENERATORS[targetType](dtarget as any);
            Reflect.setPrototypeOf(target, AnnotationTargetImpl.prototype);

            Object.seal(target);

            return target;
        }) as any;
    }

    static atLocation<D extends AnnotationType>(
        target: ClassAnnotationTarget<any>,
        location: AnnotationLocation<any, D>,
    ): AnnotationTarget<any, D> {
        const srcTarget = AnnotationLocation.getTarget(location);
        return AnnotationTargetFactory.create(
            Object.assign({}, srcTarget, {
                proto: target.declaringClass.proto,
            }),
        );
    }
}

function _metaKey(ref: string): string {
    return `Decorizer.target:${ref}`;
}

class AnnotationTargetImpl {
    toString() {
        return (this as any).ref;
    }
}

type MutableAnnotationTarget<T, D extends AnnotationType> = Mutable<Partial<AnnotationTarget<T, D>>>;

function _createClassAnnotationTarget<T, D extends ClassAnnotation>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget(dtarget, AnnotationTargetType.CLASS, ['proto']);

    d.label = `class "${d.proto.constructor.name}"`;
    d.name = d.proto.constructor.name;
    d.declaringClass = d as any;
    d.location = dtarget.location ?? AnnotationLocation.create(d as any);
    Object.defineProperties(d, {
        parent: _parentClassTargetProperty(d),
        parentClass: _parentClassTargetProperty(d),
    });

    return d as AnnotationTarget<T, D>;
}

function _createMethodAnnotationTarget<T, D extends MethodAnnotation>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const target = _createAnnotationTarget(dtarget, AnnotationTargetType.METHOD, [
        'proto',
        'propertyKey',
        'descriptor',
    ]);

    target.label = `method "${target.proto.constructor.name}.${String(target.propertyKey)}"`;
    target.name = target.propertyKey;
    Object.defineProperties(target, {
        declaringClass: _declaringClassTargetProperty(target),
        parent: _declaringClassTargetProperty(target),
        parentClass: _parentClassTargetProperty(target),
    });

    target.location = dtarget.location ?? AnnotationLocation.create(target);

    return target as AnnotationTarget<T, D>;
}

function _createPropertyAnnotationTarget<T, D extends PropertyAnnotation>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget(dtarget, AnnotationTargetType.PROPERTY, ['proto', 'propertyKey']);

    d.label = `property "${d.proto.constructor.name}.${String(d.propertyKey)}"`;
    Object.defineProperties(d, {
        declaringClass: _declaringClassTargetProperty(d),
        parent: _declaringClassTargetProperty(d),
        parentClass: _parentClassTargetProperty(d),
    });
    d.location = dtarget.location ?? AnnotationLocation.create(d as any);

    return d as AnnotationTarget<T, D>;
}

function _createParameterAnnotationTarget<T, D extends ParameterAnnotation>(
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget<T, D>(dtarget, AnnotationTargetType.PARAMETER, [
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
    d.location = dtarget.location ?? AnnotationLocation.create(d as any);
    d.descriptor = Reflect.getOwnPropertyDescriptor(d.proto, d.propertyKey) as any;

    return d as AnnotationTarget<T, D>;
}

function _createAnnotationTarget<T, D extends AnnotationType>(
    d: AnnotationTargetLike<T, D>,
    type: AnnotationTargetType,
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
                : (AnnotationTargetFactory.of([parentProto]) as ClassAnnotationTarget<any>);
        },
    } as PropertyDescriptor;
}

function _declaringClassTargetProperty(dtarget: Partial<AnnotationTarget<any, AnnotationType>>): PropertyDescriptor {
    return {
        get() {
            return AnnotationTargetFactory.create(dtarget, AnnotationTargetType.CLASS);
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
