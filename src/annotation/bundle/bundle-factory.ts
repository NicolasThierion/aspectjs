import { AnnotationTarget, ClassAdviceTarget } from '../target/annotation-target';
import { assert, getMetaOrDefault, getOrDefault, isUndefined } from '../../utils';
import { AnnotationContextSelector, AnnotationsBundle } from './bundle';
import { AnnotationContext, ClassAnnotationContext } from '../context/context';
import { AnnotationLocation, AnnotationLocationFactory } from '../location/location';
import { AnnotationType } from '../annotation.types';

export abstract class AnnotationBundleRegistry {
    static of<T>(target: AnnotationTarget<T, any>): AnnotationsBundle<T> {
        return getMetaOrDefault(
            'aspectjs.bundle',
            target.proto,
            () => new AnnotationsBundleImpl(target.declaringClass),
        );
    }

    static addContext<T>(target: AnnotationTarget<T, any>, context: AnnotationContext<any, any>): AnnotationsBundle<T> {
        const bundle = AnnotationBundleRegistry.of(target) as AnnotationsBundleImpl<T>;
        bundle.addAnnotationContext(context);
        return bundle;
    }
}

interface AnnotationContextsHolder<T, A extends AnnotationType> {
    byAnnotationName: {
        [decoratorName: string]: AnnotationContext<T, A>[];
    };
    all: AnnotationContext<T, A>[];
    byPropertyName?: {
        [propertyName: string]: AnnotationContextsHolder<T, A>;
    };
    byIndex?: {
        [argIndex: string]: AnnotationContextsHolder<T, A>;
    };
}

function _createContextsHolder<T, A extends AnnotationType>(): AnnotationContextsHolder<T, A> {
    return {
        byAnnotationName: {},
        all: [],
    } as AnnotationContextsHolder<T, A>;
}

class AnnotationsBundleImpl<T> implements AnnotationsBundle<T> {
    private _target: AnnotationTarget<T, AnnotationType.CLASS>;

    private _contextHolders = {
        [AnnotationType.PROPERTY]: _createContextsHolder<any, any>(),
        [AnnotationType.CLASS]: _createContextsHolder<any, any>(),
        [AnnotationType.METHOD]: _createContextsHolder<any, any>(),
        [AnnotationType.PARAMETER]: _createContextsHolder<any, any>(),
    };

    private _global = _createContextsHolder<T, AnnotationType>();

    constructor(target: ClassAdviceTarget<T>) {
        this._target = target;
    }

    at<A extends AnnotationType>(location: AnnotationLocation<T, A>): AnnotationContextSelector<T, A> {
        const target = AnnotationLocationFactory.getTarget<T, A>(location);

        return new AnnotationContextSelectorImpl<T, A>(
            target ? this._getContextHolders<A>(target, false)[0] : _createContextsHolder<T, A>(),
        );
    }

    addAnnotationContext(ctxt: AnnotationContext<T, AnnotationType>): void {
        const name = ctxt.toString();

        const holders = this._getContextHolders(ctxt.target, true);

        holders.forEach(holder => {
            AnnotationLocationFactory.create(ctxt.target);
            getOrDefault(holder.byAnnotationName, name, () => []).push(ctxt);
            holder.all.push(ctxt as ClassAnnotationContext<T>);
        });

        if (ctxt.target.type === AnnotationType.PARAMETER) {
            holders.forEach(h => {
                h.all = h.all.sort((d1, d2) => d1.target.parameterIndex - d2.target.parameterIndex);
                h.byAnnotationName[name] = h.byAnnotationName[name].sort(
                    (d1, d2) => d1.target.parameterIndex - d2.target.parameterIndex,
                );
            });
        }
    }

    @Enumerable(false)
    private _getContextHolders<A extends AnnotationType>(
        target: AnnotationTarget<T, A>,
        save: boolean,
    ): AnnotationContextsHolder<T, A>[] {
        if (!target) {
            return [];
        }

        if (target.type === AnnotationType.CLASS) {
            return [this._contextHolders[target.type], this._global];
        } else if (
            target.type === AnnotationType.PARAMETER ||
            target.type === AnnotationType.PROPERTY ||
            target.type === AnnotationType.METHOD
        ) {
            const byAnnotation = this._contextHolders[target.type];
            byAnnotation.byPropertyName = byAnnotation.byPropertyName ?? ({} as any);

            const byPropertyName = getOrDefault(
                byAnnotation.byPropertyName as any,
                target.propertyKey,
                () => {
                    return { all: [], byAnnotationName: {} } as AnnotationContextsHolder<any, any>;
                },
                save,
            ) as AnnotationContextsHolder<T, A>;

            if (target.type === AnnotationType.PARAMETER) {
                byPropertyName.byIndex = byPropertyName.byIndex ?? {};
                const byIndex = getOrDefault(
                    byPropertyName.byIndex as any,
                    `${target.parameterIndex}`,
                    _createContextsHolder,
                    save,
                ) as AnnotationContextsHolder<T, A>;

                assert(!save || !isNaN(target.parameterIndex));

                const allArgsContext = getOrDefault(
                    byPropertyName.byIndex as any,
                    `NaN`,
                    _createContextsHolder,
                    save,
                ) as AnnotationContextsHolder<T, A>;

                return [byIndex, allArgsContext, byPropertyName, byAnnotation, this._global];
            }

            return [byPropertyName, byAnnotation, this._global];
        }

        assert(false, `unknown decorator type: ${target.type}`);
    }

    all(decoratorName?: string): readonly AnnotationContext<T, AnnotationType>[] {
        return new AnnotationContextSelectorImpl(this._global).all(decoratorName);
    }

    class(decoratorName?: string): readonly AnnotationContext<T, AnnotationType>[] {
        return new AnnotationContextSelectorImpl<T, AnnotationType>(this._contextHolders[AnnotationType.CLASS]).all(
            decoratorName,
        );
    }
    properties(decoratorName?: string): readonly AnnotationContext<T, AnnotationType>[] {
        return new AnnotationContextSelectorImpl(this._contextHolders[AnnotationType.PROPERTY]).all(decoratorName);
    }
    methods(decoratorName?: string): readonly AnnotationContext<T, AnnotationType>[] {
        return new AnnotationContextSelectorImpl(this._contextHolders[AnnotationType.METHOD]).all(decoratorName);
    }
    parameters(decoratorName?: string): readonly AnnotationContext<T, AnnotationType>[] {
        return new AnnotationContextSelectorImpl(this._contextHolders[AnnotationType.PARAMETER]).all(decoratorName);
    }
}

class AnnotationContextSelectorImpl<T, A extends AnnotationType> implements AnnotationContextSelector<T, A> {
    constructor(private _holder: AnnotationContextsHolder<T, A>) {
        assert(!!this._holder);
    }
    all(decoratorName?: string): readonly AnnotationContext<T, A>[] {
        return Object.freeze([
            ...(isUndefined(decoratorName) ? this._holder.all : this._holder.byAnnotationName[decoratorName] ?? []),
        ]);
    }
}

// TODO turn into aspect
function Enumerable(value: boolean): PropertyDecorator {
    return function(target: any, propertyKey: string) {
        const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) ?? {};
        if (descriptor.enumerable !== value) {
            descriptor.enumerable = value;
        }
    };
}
