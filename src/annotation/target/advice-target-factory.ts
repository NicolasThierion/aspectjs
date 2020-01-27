import { assert, clone, getMetaOrDefault, getProto, isNumber, isObject, isUndefined, Mutable } from '../../utils';
import { AnnotationLocation } from '../location/location';
import {
    AnnotationTarget,
    ClassAdviceTarget,
    MethodAdviceTarget,
    ParameterAdviceTarget,
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

export abstract class AdviceTargetFactory {
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

        return AdviceTargetFactory.create(atarget as any);
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

            Object.seal(target);

            return target;
        }) as any;
    }

    static atLocation<T, D extends AnnotationType>(
        target: ClassAdviceTarget<T>,
        location: AnnotationLocation<T, D>,
    ): AnnotationTarget<T, D> {
        const srcTarget = AnnotationLocation.getTarget(location);
        return AdviceTargetFactory.create(
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
    d.location = dtarget.location ?? AnnotationLocation.create(d as any);
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

    target.location = dtarget.location ?? AnnotationLocation.create(target);

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
    d.location = dtarget.location ?? AnnotationLocation.create(d as any);

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
    d.location = dtarget.location ?? AnnotationLocation.create(d as any);
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
                : (AdviceTargetFactory.of([parentProto]) as ClassAdviceTarget<any>);
        },
    } as PropertyDescriptor;
}

function _declaringClassTargetProperty(dtarget: Partial<AnnotationTarget<any, AnnotationType>>): PropertyDescriptor {
    return {
        get() {
            return AdviceTargetFactory.create(dtarget, AnnotationType.CLASS);
        },
    } as PropertyDescriptor;
}

function _declaringMethodTargetProperty(dtarget: Partial<AnnotationTarget<any, AnnotationType>>): PropertyDescriptor {
    return {
        get() {
            return AdviceTargetFactory.of([dtarget.proto, dtarget.propertyKey]) as any;
        },
    } as PropertyDescriptor;
}
