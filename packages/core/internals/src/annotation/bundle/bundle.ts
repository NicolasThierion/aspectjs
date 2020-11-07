import { AnnotationContext } from '../context/annotation-context';
import { Annotation, AnnotationType } from '../annotation.types';
import {
    AnnotationLocation,
    ClassAnnotationLocation,
    MethodAnnotationLocation,
    ParametersAnnotationLocation,
    PropertyAnnotationLocation,
} from '../location/annotation-location';
import { locator } from '../../utils/locator';
import { AnnotationTarget } from '../target/annotation-target';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { isString } from '../../utils/utils';

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
        annotation?: Annotation<AnnotationType.PROPERTY>,
    ): readonly AnnotationContext<unknown, AnnotationType.PROPERTY>[];

    onProperty(
        annotation?: Annotation<AnnotationType.PROPERTY> | string,
    ): readonly AnnotationContext<T, AnnotationType.PROPERTY>[];
}

/**
 * @public
 */
export interface MethodAnnotationsBundle<T = unknown> {
    all(
        annotation?: Annotation<AnnotationType.METHOD | AnnotationType.PARAMETER>,
    ): readonly AnnotationContext<T, AnnotationType.METHOD | AnnotationType.PARAMETER>[];
    onParameter(
        annotation?: Annotation<AnnotationType.PARAMETER>,
    ): readonly AnnotationContext<T, AnnotationType.PARAMETER>[];

    onMethod(
        annotation?: Annotation<AnnotationType.METHOD> | string,
    ): readonly AnnotationContext<T, AnnotationType.METHOD | AnnotationType.PARAMETER>[];
}
/**
 * @public
 */
export interface ParameterAnnotationsBundle<T = unknown> {
    all(annotation?: Annotation<AnnotationType.PARAMETER>): readonly AnnotationContext<T, AnnotationType.PARAMETER>[];

    onParameter(
        annotation?: Annotation<AnnotationType.PARAMETER>,
    ): readonly AnnotationContext<T, AnnotationType.PARAMETER>[];
}

/**
 * @public
 */
export class RootAnnotationsBundle {
    constructor(protected _registry: AnnotationBundleRegistry, protected _targetFactory: AnnotationTargetFactory) {}
    at<T>(location: MethodAnnotationLocation<T>, searchParents?: boolean): MethodAnnotationsBundle<T>;
    at<T>(location: ParametersAnnotationLocation<T>, searchParents?: boolean): ParameterAnnotationsBundle<T>;
    at<T>(location: PropertyAnnotationLocation<T>, searchParents?: boolean): PropertyAnnotationsBundle<T>;
    at<T>(location: ClassAnnotationLocation<T>, searchParents?: boolean): ClassAnnotationsBundle<T>;
    at<T>(location: AnnotationLocation<T>, searchParents?: boolean): AnnotationsBundle<T>;
    at<T>(location: AnnotationLocation<T>, searchParents = true): AnnotationsBundle<T> {
        return new ClassAnnotationsBundle<T>(this._registry, this._targetFactory, location, searchParents);
    }

    all(...annotations: (Annotation | string)[]): readonly AnnotationContext[] {
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
export class ClassAnnotationsBundle<T = unknown> extends RootAnnotationsBundle
    implements ParameterAnnotationsBundle<T>, PropertyAnnotationsBundle<T>, MethodAnnotationsBundle<T> {
    constructor(
        registry: AnnotationBundleRegistry,
        targetFactory: AnnotationTargetFactory,
        private location: AnnotationLocation,
        private searchParents: boolean,
    ) {
        super(registry, targetFactory);
    }
    all(...annotations: (Annotation | string)[]): readonly AnnotationContext<T>[] {
        const target = this._targetFactory.getTarget(this.location);
        return this._allWithFilter(target, 'all', annotations) as AnnotationContext<T>[];
    }

    onClass(
        ...annotations: (Annotation<AnnotationType.CLASS> | string)[]
    ): readonly AnnotationContext<T, AnnotationType.CLASS>[] {
        const target = this._targetFactory.getTarget(this.location);

        return this._allWithFilter(target, 'class', annotations) as AnnotationContext<T, AnnotationType.CLASS>[];
    }

    onProperty(
        ...annotations: (Annotation<AnnotationType.PROPERTY> | string)[]
    ): readonly AnnotationContext<T, AnnotationType.PROPERTY>[] {
        const target = this._targetFactory.getTarget(this.location);

        return this._allWithFilter(target, 'property', annotations) as AnnotationContext<T, AnnotationType.PROPERTY>[];
    }
    onMethod(
        ...annotations: (Annotation<AnnotationType.METHOD> | string)[]
    ): readonly AnnotationContext<T, AnnotationType.METHOD>[] {
        const target = this._targetFactory.getTarget(this.location);

        return this._allWithFilter(target, 'method', annotations) as AnnotationContext<T, AnnotationType.METHOD>[];
    }
    onParameter(
        ...annotations: (Annotation<AnnotationType.PARAMETER> | string)[]
    ): readonly AnnotationContext<T, AnnotationType.PARAMETER>[] {
        const target = this._targetFactory.getTarget(this.location);

        return this._allWithFilter(target, 'parameter', annotations) as AnnotationContext<
            T,
            AnnotationType.PARAMETER
        >[];
    }

    private _allWithFilter(
        target: AnnotationTarget,
        filter: keyof Filters[AnnotationType],
        annotations: (Annotation | string)[],
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
        class(target: AnnotationTarget, a: AnnotationContext): boolean;
        property(target: AnnotationTarget, a: AnnotationContext): boolean;
        method(target: AnnotationTarget, a: AnnotationContext): boolean;
        parameter(target: AnnotationTarget, a: AnnotationContext): boolean;
    };
};
const falseFilter = () => false;

const FILTERS: Filters = {
    [AnnotationType.CLASS]: {
        all(target: AnnotationTarget, a: AnnotationContext) {
            // keep all if location is the class
            return true;
        },
        class(target: AnnotationTarget, a: AnnotationContext) {
            // keep only annotations on classes
            return a.target.type === AnnotationType.CLASS;
        },
        property(target: AnnotationTarget, a: AnnotationContext) {
            // keep only annotations on properties
            return a.target.type === AnnotationType.PROPERTY;
        },

        method(target: AnnotationTarget, a: AnnotationContext) {
            // keep only annotations on properties
            return a.target.type === AnnotationType.METHOD;
        },

        parameter(target: AnnotationTarget, a: AnnotationContext) {
            // keep only annotations on properties
            return a.target.type === AnnotationType.PARAMETER;
        },
    },
    [AnnotationType.PROPERTY]: {
        all(target: AnnotationTarget, a: AnnotationContext) {
            // keep if same propertyKey
            return target.propertyKey === a.target.propertyKey;
        },
        class: falseFilter,
        property(target: AnnotationTarget, a: AnnotationContext) {
            return FILTERS[target.type].all(target, a);
        },
        method: falseFilter,
        parameter: falseFilter,
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
        class: falseFilter,
        property: falseFilter,
        method(target: AnnotationTarget, a: AnnotationContext) {
            return (
                // keep only annotations on properties
                a.target.type === AnnotationType.METHOD &&
                // keep only the required method if location is the method
                target.propertyKey === a.target.propertyKey
            );
        },

        parameter(target: AnnotationTarget, a: AnnotationContext) {
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
        class: falseFilter,
        property: falseFilter,
        method: falseFilter,
        parameter(target: AnnotationTarget, a: AnnotationContext) {
            return FILTERS[target.type].all(target, a);
        },
    },
};

function getAnnotationRef(annotation: string | Annotation): string {
    return isString(annotation) ? (annotation as string) : annotation?.ref;
}
