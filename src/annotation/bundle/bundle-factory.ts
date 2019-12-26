import { AnnotationTarget, AnnotationTargetType, ClassAnnotationTarget } from '../target/annotation-target';
import { assert, clone, getMetaOrDefault, getOrDefault, isUndefined } from '../../utils';
import { ClassAnnotation } from '../annotation.types';
import { AnnotationContextSelector, AnnotationsBundle } from './bundle';
import { AnnotationType } from '../annotation.types';
import { AnnotationContext } from '../context/context';
import { AnnotationLocation, AnnotationLocationFactory } from '../location/location';
import { ClassAnnotationContext } from '../context/context';

export abstract class AnnotationBundleFactory {
    static of<T>(target: AnnotationTarget<T, any>): AnnotationsBundle<T> | undefined {
        return getMetaOrDefault(
            'aspectjs.bundle',
            target.proto,
            () => new AnnotationsBundleImpl(target.declaringClass),
        );
    }
}

interface AnnotationContextsHolder<T, D extends AnnotationType> {
    byAnnotationName: {
        [decoratorName: string]: AnnotationContext<T, D>[];
    };
    all: AnnotationContext<T, D>[];
    byPropertyName?: {
        [propertyName: string]: AnnotationContextsHolder<T, D>;
    };
    byIndex?: {
        [argIndex: string]: AnnotationContextsHolder<T, D>;
    };
}

function _createContextsHolder<T, D extends AnnotationType>(): AnnotationContextsHolder<T, D> {
    return {
        byAnnotationName: {},
        all: [],
    } as AnnotationContextsHolder<T, D>;
}

export class AnnotationsBundleImpl<T> implements AnnotationsBundle<T> {
    private _target: AnnotationTarget<T, ClassAnnotation>;

    private _contextHolders: AnnotationContextsHolder<any, any>[] = new Array(4)
        .fill(() => _createContextsHolder<any, any>())
        .map(c => c());

    private _global = _createContextsHolder<T, AnnotationType>();

    constructor(target: ClassAnnotationTarget<T>) {
        this._target = target;
    }

    at<D extends AnnotationType>(location: AnnotationLocation<T, D>): AnnotationContextSelector<T, D> {
        const target = AnnotationLocationFactory.getTarget(location);

        return new AnnotationContextSelectorImpl<T, D>(
            target ? this._getContextHolders(target, false)[0] : _createContextsHolder(),
        );
    }

    addAnnotation(ctxt: AnnotationContext<T, AnnotationType>): void {
        const name = ctxt.annotation.name;

        const holders = this._getContextHolders(ctxt.target, true);

        holders.forEach(holder => {
            AnnotationLocationFactory.create(ctxt.target);
            getOrDefault(holder.byAnnotationName, name, () => []).push(ctxt);
            holder.all.push(ctxt as ClassAnnotationContext<T>);
        });

        if (ctxt.target.type === AnnotationTargetType.PARAMETER) {
            holders.forEach(h => {
                h.all = h.all.sort((d1, d2) => d1.target.parameterIndex - d2.target.parameterIndex);
                h.byAnnotationName[name] = h.byAnnotationName[name].sort(
                    (d1, d2) => d1.target.parameterIndex - d2.target.parameterIndex,
                );
            });
        }
    }

    @Enumerable(false)
    private _getContextHolders<D extends AnnotationType>(
        target: AnnotationTarget<T, D>,
        save: boolean,
    ): AnnotationContextsHolder<T, D>[] {
        if (!target) {
            return [];
        }

        if (target.type === AnnotationTargetType.CLASS) {
            return [this._contextHolders[target.type] as AnnotationContextsHolder<T, D>, this._global];
        } else if (target.type <= AnnotationTargetType.PARAMETER) {
            const byAnnotationType = this._contextHolders[target.type];
            byAnnotationType.byPropertyName = byAnnotationType.byPropertyName ?? ({} as any);

            const byPropertyName = getOrDefault(
                byAnnotationType.byPropertyName as any,
                target.propertyKey,
                () => {
                    return { all: [], byAnnotationName: {} } as AnnotationContextsHolder<any, any>;
                },
                save,
            ) as AnnotationContextsHolder<T, D>;

            if (target.type === AnnotationTargetType.PARAMETER) {
                byPropertyName.byIndex = byPropertyName.byIndex ?? {};
                const byIndex = getOrDefault(
                    byPropertyName.byIndex as any,
                    `${target.parameterIndex}`,
                    _createContextsHolder,
                    save,
                ) as AnnotationContextsHolder<T, D>;

                assert(!save || !isNaN(target.parameterIndex));

                const allArgsContext = getOrDefault(
                    byPropertyName.byIndex as any,
                    `NaN`,
                    _createContextsHolder,
                    save,
                ) as AnnotationContextsHolder<T, D>;

                return [byIndex, allArgsContext, byPropertyName, byAnnotationType, this._global];
            }

            return [byPropertyName, byAnnotationType, this._global];
        }

        assert(false, `unknown decorator type: ${target.type}`);
    }

    all(decoratorName?: string): AnnotationContext<T, AnnotationType>[] {
        return new AnnotationContextSelectorImpl(this._global).all(decoratorName);
    }

    class(decoratorName?: string): AnnotationContext<T, AnnotationType>[] {
        return new AnnotationContextSelectorImpl<T, AnnotationType>(
            this._contextHolders[AnnotationTargetType.CLASS],
        ).all(decoratorName);
    }
    properties(decoratorName?: string): AnnotationContext<T, AnnotationType>[] {
        return new AnnotationContextSelectorImpl(this._contextHolders[AnnotationTargetType.PROPERTY]).all(
            decoratorName,
        );
    }
    methods(decoratorName?: string): AnnotationContext<T, AnnotationType>[] {
        return new AnnotationContextSelectorImpl(this._contextHolders[AnnotationTargetType.METHOD]).all(decoratorName);
    }
    parameters(decoratorName?: string): AnnotationContext<T, AnnotationType>[] {
        return new AnnotationContextSelectorImpl(this._contextHolders[AnnotationTargetType.PARAMETER]).all(
            decoratorName,
        );
    }
}

export class AnnotationContextSelectorImpl<T, D extends AnnotationType> implements AnnotationContextSelector<T, D> {
    constructor(private _holder: AnnotationContextsHolder<T, D>) {
        assert(!!this._holder);
    }
    all(decoratorName?: string): AnnotationContext<T, D>[] {
        return isUndefined(decoratorName)
            ? Object.seal(clone(this._holder.all))
            : Object.seal(clone(this._holder.byAnnotationName[decoratorName] ?? []));
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
