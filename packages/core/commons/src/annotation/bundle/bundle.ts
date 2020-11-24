import { isString, locator } from '@aspectjs/core/utils';
import { Annotation, AnnotationRef, AnnotationType } from '../annotation.types';
import { AnnotationContext } from '../context/annotation.context';
import {
    AnnotationLocation,
    ClassAnnotationLocation,
    MethodAnnotationLocation,
    ParametersAnnotationLocation,
    PropertyAnnotationLocation,
} from '../location/annotation-location';
import { AnnotationLocationFactory } from '../location/location.factory';
import { AnnotationTarget } from '../target/annotation-target';

/**
 * @public
 */
export type AnnotationBundleRegistry<T = unknown, A extends AnnotationType = any> = {
    byTargetClassRef: {
        [classTargetRef: string]: {
            byAnnotation: {
                [annotationRef: string]: AnnotationContext[];
            };
            all: AnnotationContext[];
        };
    };
    byAnnotation: {
        [annotationRef: string]: AnnotationContext[];
    };
};

/**
 * @public
 */
export type AnnotationsBundle<T = unknown> =
    | ClassAnnotationsBundle<T>
    | MethodAnnotationsBundle<T>
    | ParameterAnnotationsBundle<T>
    | PropertyAnnotationsBundle<T>;

/**
 * @public
 */
export interface PropertyAnnotationsBundle<T = unknown> {
    all(
        ...annotation: (Annotation<AnnotationType.PROPERTY> | string | AnnotationRef)[]
    ): readonly AnnotationContext<unknown, AnnotationType.PROPERTY>[];

    onProperty(
        ...annotation: (Annotation<AnnotationType.PROPERTY> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.PROPERTY>[];

    onSelf(
        ...annotation: (Annotation<AnnotationType.PROPERTY> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.PROPERTY>[];
}

/**
 * @public
 */
export interface MethodAnnotationsBundle<T = unknown> {
    all(
        ...annotation: (Annotation<AnnotationType.METHOD | AnnotationType.PARAMETER> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.METHOD | AnnotationType.PARAMETER>[];
    onParameter(
        ...annotation: (Annotation<AnnotationType.PARAMETER> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.PARAMETER>[];

    onMethod(
        ...annotation: (Annotation<AnnotationType.METHOD> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.METHOD | AnnotationType.PARAMETER>[];

    onSelf(
        ...annotation: (Annotation<AnnotationType.METHOD> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.METHOD | AnnotationType.PARAMETER>[];
}
/**
 * @public
 */
export interface ParameterAnnotationsBundle<T = unknown> {
    all(
        ...annotation: (Annotation<AnnotationType.PARAMETER> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.PARAMETER>[];

    onSelf(
        ...annotation: (Annotation<AnnotationType.PARAMETER> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.PARAMETER>[];

    onParameter(
        ...annotation: (Annotation<AnnotationType.PARAMETER> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.PARAMETER>[];
}

/**
 * @public
 */
export class RootAnnotationsBundle {
    constructor(protected _registry: AnnotationBundleRegistry) {}
    at<T>(location: MethodAnnotationLocation<T>, searchParents?: boolean): MethodAnnotationsBundle<T>;
    at<T>(location: ParametersAnnotationLocation<T>, searchParents?: boolean): ParameterAnnotationsBundle<T>;
    at<T>(location: PropertyAnnotationLocation<T>, searchParents?: boolean): PropertyAnnotationsBundle<T>;
    at<T>(location: ClassAnnotationLocation<T>, searchParents?: boolean): ClassAnnotationsBundle<T>;
    at<T>(location: AnnotationLocation<T>, searchParents?: boolean): AnnotationsBundle<T>;
    at<T>(location: AnnotationLocation<T>, searchParents = true): AnnotationsBundle<T> {
        return new ClassAnnotationsBundle<T>(this._registry, location, searchParents);
    }

    all(...annotations: (Annotation | string | AnnotationRef)[]): readonly AnnotationContext[] {
        if (annotations && annotations.length === 1) {
            return locator(this._registry.byAnnotation)
                .at(getAnnotationRef(annotations[0]))
                .orElseGet(() => []);
        }

        let entries = Object.entries(this._registry.byAnnotation);
        if (annotations && annotations.length) {
            const annotationsSet = new Set<string>(annotations.map((a) => getAnnotationRef(a)));
            entries = entries.filter((e) => annotationsSet.has(e[0]));
        }
        return entries.map((e) => e[1]).flat();
    }
}

/**
 * @public
 */
export class ClassAnnotationsBundle<T = unknown> extends RootAnnotationsBundle {
    private _target: AnnotationTarget;
    constructor(registry: AnnotationBundleRegistry, location: AnnotationLocation, private searchParents: boolean) {
        super(registry);
        this._target = AnnotationLocationFactory.getTarget(location);
    }
    all(...annotations: (Annotation | string | AnnotationRef)[]): readonly AnnotationContext<T>[] {
        return this._allWithFilter(this._target, 'all', annotations) as AnnotationContext<T>[];
    }

    onClass(
        ...annotations: (Annotation<AnnotationType.CLASS> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.CLASS>[] {
        return this._allWithFilter(this._target, AnnotationType.CLASS, annotations) as AnnotationContext<
            T,
            AnnotationType.CLASS
        >[];
    }

    onSelf(
        ...annotations: (Annotation<AnnotationType.CLASS> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.CLASS>[] {
        return this._allWithFilter(this._target, this._target.type, annotations) as AnnotationContext<
            T,
            AnnotationType.CLASS
        >[];
    }

    onProperty(
        ...annotations: (Annotation<AnnotationType.PROPERTY> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.PROPERTY>[] {
        return this._allWithFilter(this._target, AnnotationType.PROPERTY, annotations) as AnnotationContext<
            T,
            AnnotationType.PROPERTY
        >[];
    }
    onMethod(
        ...annotations: (Annotation<AnnotationType.METHOD> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.METHOD>[] {
        return this._allWithFilter(this._target, AnnotationType.METHOD, annotations) as AnnotationContext<
            T,
            AnnotationType.METHOD
        >[];
    }
    onParameter(
        ...annotations: (Annotation<AnnotationType.PARAMETER> | string | AnnotationRef)[]
    ): readonly AnnotationContext<T, AnnotationType.PARAMETER>[] {
        return this._allWithFilter(this._target, AnnotationType.PARAMETER, annotations) as AnnotationContext<
            T,
            AnnotationType.PARAMETER
        >[];
    }

    private _allWithFilter(
        target: AnnotationTarget,
        filter: keyof Filters[AnnotationType],
        annotations: (Annotation | string | AnnotationRef)[],
    ): AnnotationContext<T>[] {
        if (!target) {
            return [];
        }

        const parentContext: AnnotationContext[] =
            target.parentClass && this.searchParents
                ? this._allWithFilter(target.parentClass, filter, annotations)
                : [];
        const reg = locator(this._registry.byTargetClassRef).at(target.declaringClass.ref).get();

        if (!reg) {
            return parentContext as AnnotationContext<T>[];
        }

        const annotationsRef = (annotations ?? []).map(getAnnotationRef);
        let contexts = reg.all;
        if (annotationsRef.length) {
            contexts = annotationsRef
                .map((annotationRef) =>
                    locator(reg.byAnnotation)
                        .at(annotationRef)
                        .orElseGet(() => []),
                )
                .flat();
        }
        contexts = contexts.filter((a) => FILTERS[target.type][filter](target, a)) as AnnotationContext<T>[];

        return [...parentContext, ...contexts] as AnnotationContext<T>[];
    }
}
//
// const b: RootAnnotationsBundle = undefined;
//
// const o = { attr: '', method() {} };
// const l = AnnotationLocation.of(o);
// b.at(AnnotationLocation.of(o)).all();
//
// b.at(AnnotationLocation.of(o).attr).all();
// b.at(AnnotationLocation.of(o).attr).onProperty();
// b.at(AnnotationLocation.of(o).attr).onMethod();
// b.at(AnnotationLocation.of(o).attr).onParameter();
//
// b.at(AnnotationLocation.of(o).method).all();
// b.at(AnnotationLocation.of(o).method).onProperty();
// b.at(AnnotationLocation.of(o).method).onMethod();
// b.at(AnnotationLocation.of(o).method).onParameter();
//
// b.at(AnnotationLocation.of(o).method.args).all();
// b.at(AnnotationLocation.of(o).method.args).onProperty();
// b.at(AnnotationLocation.of(o).method.args).onMethod();
// b.at(AnnotationLocation.of(o).method.args).onParameter();

type Filters = {
    [atLocation in AnnotationType]: {
        all(target: AnnotationTarget, a: AnnotationContext): boolean;
        [AnnotationType.CLASS](target: AnnotationTarget, a: AnnotationContext): boolean;
        [AnnotationType.PROPERTY](target: AnnotationTarget, a: AnnotationContext): boolean;
        [AnnotationType.METHOD](target: AnnotationTarget, a: AnnotationContext): boolean;
        [AnnotationType.PARAMETER](target: AnnotationTarget, a: AnnotationContext): boolean;
    };
};
const falseFilter = () => false;

const FILTERS: Filters = {
    [AnnotationType.CLASS]: {
        all(target: AnnotationTarget, a: AnnotationContext) {
            // keep all if location is the class
            return true;
        },
        [AnnotationType.CLASS](target: AnnotationTarget, a: AnnotationContext) {
            // keep only annotations on classes
            return a.target.type === AnnotationType.CLASS;
        },
        [AnnotationType.PROPERTY](target: AnnotationTarget, a: AnnotationContext) {
            // keep only annotations on properties
            return a.target.type === AnnotationType.PROPERTY;
        },

        [AnnotationType.METHOD](target: AnnotationTarget, a: AnnotationContext) {
            // keep only annotations on properties
            return a.target.type === AnnotationType.METHOD;
        },

        [AnnotationType.PARAMETER](target: AnnotationTarget, a: AnnotationContext) {
            // keep only annotations on properties
            return a.target.type === AnnotationType.PARAMETER;
        },
    },
    [AnnotationType.PROPERTY]: {
        all(target: AnnotationTarget, a: AnnotationContext) {
            // keep if same propertyKey
            return target.propertyKey === a.target.propertyKey;
        },
        [AnnotationType.CLASS]: falseFilter,
        [AnnotationType.PROPERTY](target: AnnotationTarget, a: AnnotationContext) {
            return FILTERS[target.type].all(target, a);
        },
        [AnnotationType.METHOD]: falseFilter,
        [AnnotationType.PARAMETER]: falseFilter,
    },
    [AnnotationType.METHOD]: {
        all(target: AnnotationTarget, a: AnnotationContext) {
            const aTarget = a.target;

            // keep if same propertyKey
            return (
                target.propertyKey === aTarget.propertyKey &&
                (aTarget.type === AnnotationType.PARAMETER || aTarget.type === AnnotationType.METHOD)
            );
        },
        [AnnotationType.CLASS]: falseFilter,
        [AnnotationType.PROPERTY]: falseFilter,
        [AnnotationType.METHOD](target: AnnotationTarget, a: AnnotationContext) {
            return (
                // keep only annotations on properties
                a.target.type === AnnotationType.METHOD &&
                // keep only the required method if location is the method
                target.propertyKey === a.target.propertyKey
            );
        },

        [AnnotationType.PARAMETER](target: AnnotationTarget, a: AnnotationContext) {
            return (
                // keep only annotations on properties
                a.target.type === AnnotationType.PARAMETER &&
                // keep all parameters on method if location is the method
                target.propertyKey === a.target.propertyKey
            );
        },
    },
    [AnnotationType.PARAMETER]: {
        all(target: AnnotationTarget, a: AnnotationContext) {
            const aTarget = a.target;

            return (
                // keep if same propertyKey
                target.propertyKey === aTarget.propertyKey &&
                // keep parameters if location is parameters
                aTarget.type === AnnotationType.PARAMETER &&
                (isNaN(target.parameterIndex) || target.parameterIndex === aTarget.parameterIndex)
            );
        },
        [AnnotationType.CLASS]: falseFilter,
        [AnnotationType.PROPERTY]: falseFilter,
        [AnnotationType.METHOD]: falseFilter,
        [AnnotationType.PARAMETER](target: AnnotationTarget, a: AnnotationContext) {
            return FILTERS[target.type].all(target, a);
        },
    },
};

function getAnnotationRef(annotation: Annotation | string | AnnotationRef): string {
    return isString(annotation) ? (annotation as string) : annotation?.ref;
}
