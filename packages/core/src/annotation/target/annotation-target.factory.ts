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
    AdviceTarget,
    ClassAdviceTarget,
    MethodAdviceTarget,
    ParameterAdviceTarget,
    PropertyAdviceTarget,
} from './annotation-target';
import { getReferenceConstructor, Mutable } from '../../utils/utils';
import { AdviceType } from '../../advice/types';
import { WEAVER_CONTEXT } from '../../weaver/weaver-context';
import { AnnotationLocationFactory } from '../location/location.factory';

const TARGET_GENERATORS = {
    [AdviceType.CLASS]: _createClassAnnotationTarget,
    [AdviceType.PROPERTY]: _createPropertyAnnotationTarget,
    [AdviceType.METHOD]: _createMethodAnnotationTarget,
    [AdviceType.PARAMETER]: _createParameterAnnotationTarget,
};

let globalTargetId = 0;

const REF_GENERATORS = {
    [AdviceType.CLASS]: (d: Mutable<Partial<ClassAdviceTarget<any>>>) =>
        `c[${getReferenceConstructor(d.proto).name}]#${getOrComputeMetadata(
            'aspectjs.targetId',
            d.proto,
            () => globalTargetId++,
        )}`,
    [AdviceType.PROPERTY]: (d: Mutable<Partial<PropertyAdviceTarget<any>>>) =>
        `c[${getReferenceConstructor(d.proto).name}].p[${d.propertyKey}]#${getOrComputeMetadata(
            'aspectjs.targetId',
            d.proto,
            () => globalTargetId++,
        )}`,
    [AdviceType.METHOD]: (d: Mutable<Partial<MethodAdviceTarget<any>>>) =>
        `c[${getReferenceConstructor(d.proto).name}].p[${d.propertyKey}]#${getOrComputeMetadata(
            'aspectjs.targetId',
            d.proto,
            () => globalTargetId++,
        )}`,
    [AdviceType.PARAMETER]: (d: Mutable<Partial<ParameterAdviceTarget<any>>>) =>
        `c[${getReferenceConstructor(d.proto).name}].p[${d.propertyKey}].a[${d.parameterIndex}]#${getOrComputeMetadata(
            'aspectjs.targetId',
            d.proto,
            () => globalTargetId++,
        )}`,
};

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
     * Creates a AdviceTarget corresponding to the given arguments
     * @param dtarget
     * @param type
     */
    create<T, A extends AdviceType>(dtarget: MutableAdviceTarget<T, A>, type?: AdviceType): AdviceTarget<T, A> {
        // determine advice type
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
            const target = (TARGET_GENERATORS[type] as any)(this, WEAVER_CONTEXT.annotations.location, dtarget as any);
            Reflect.setPrototypeOf(target, AnnotationTargetImpl.prototype);

            return target;
        }) as any;
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

type MutableAdviceTarget<T, A extends AdviceType> = Mutable<Partial<AdviceTarget<T, A>>>;

function _createClassAnnotationTarget<T, D extends AdviceType.CLASS>(
    targetFactory: AnnotationTargetFactory,
    locationFactory: AnnotationLocationFactory,
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget(dtarget, AdviceType.CLASS, ['proto']);

    d.label = `class "${d.proto.constructor.name}"`;
    d.name = d.proto.constructor.name;
    d.declaringClass = d as any;
    d.location = dtarget.location ?? locationFactory.create(d as any);
    const parentClass = _parentClassTargetProperty(targetFactory, d);
    Object.defineProperties(d, {
        parent: parentClass,
        parentClass,
    });

    return d as AdviceTarget<T, D>;
}

function _createMethodAnnotationTarget<T, D extends AdviceType.METHOD>(
    targetFactory: AnnotationTargetFactory,
    locationFactory: AnnotationLocationFactory,
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const target = _createAnnotationTarget(dtarget, AdviceType.METHOD, ['proto', 'propertyKey', 'descriptor']);

    target.label = `method "${target.proto.constructor.name}.${String(target.propertyKey)}"`;
    target.name = target.propertyKey;
    Object.defineProperties(target, {
        declaringClass: _declaringClassTargetProperty(targetFactory, target),
        parent: _declaringClassTargetProperty(targetFactory, target),
        parentClass: _parentClassTargetProperty(targetFactory, target),
    });

    target.location = dtarget.location ?? locationFactory.create(target);

    return target as AdviceTarget<T, D>;
}

function _createPropertyAnnotationTarget<T, D extends AdviceType.PROPERTY>(
    targetFactory: AnnotationTargetFactory,
    locationFactory: AnnotationLocationFactory,
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget(dtarget, AdviceType.PROPERTY, ['proto', 'propertyKey']);

    d.label = `property "${d.proto.constructor.name}.${String(d.propertyKey)}"`;
    Object.defineProperties(d, {
        declaringClass: _declaringClassTargetProperty(targetFactory, d),
        parent: _declaringClassTargetProperty(targetFactory, d),
        parentClass: _parentClassTargetProperty(targetFactory, d),
    });
    d.location = dtarget.location ?? locationFactory.create(d as any);

    return d as AdviceTarget<T, D>;
}

function _createParameterAnnotationTarget<T, D extends AdviceType.PARAMETER>(
    targetFactory: AnnotationTargetFactory,
    locationFactory: AnnotationLocationFactory,
    dtarget: AnnotationTargetLike<T, D>,
): AnnotationTargetLike<T, D> {
    const d = _createAnnotationTarget<T, D>(dtarget, AdviceType.PARAMETER, ['parameterIndex', 'proto', 'propertyKey']);

    d.label = `parameter "${d.proto.constructor.name}.${String(d.propertyKey)}(${
        isNaN(d.parameterIndex) ? '*' : `#${d.parameterIndex}`
    })"`;
    Object.defineProperties(d, {
        declaringClass: _declaringClassTargetProperty(targetFactory, d),
        parent: _declaringMethodTargetProperty(targetFactory, d),
        parentClass: _parentClassTargetProperty(targetFactory, d),
    });
    d.location = dtarget.location ?? locationFactory.create(d as any);
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
            return targetFactory.create(dtarget, AdviceType.CLASS);
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
