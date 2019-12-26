import { assert, getOrDefault, isFunction } from '../utils';
import { Annotation } from '../annotation/annotation.types';
import { Advice, AnnotationAspectPointcuts, Aspect, AspectHooks, POINTCUT_NAMES, PointCutHooks } from './types';

let profileId = 0;

type AspectRegistry = {
    [annotationKey: string]: {
        [aspectName: string]: {
            [pointCut in keyof PointCutHooks]?: { aspect: Aspect; advice: Advice<unknown> };
        };
    };
};

export class WeaverProfile {
    public readonly name: string;
    protected _aspects: AspectRegistry = {};

    constructor(name?: string) {
        this.name = name ?? `default#${profileId++}`;
    }
    enable(...aspects: Aspect[]): this {
        aspects.forEach(p => this.setEnabled(p, true));
        return this;
    }
    disable(...aspects: Aspect[]): this {
        aspects.forEach(p => this.setEnabled(p, false));
        return this;
    }
    merge(...profiles: WeaverProfile[]): this {
        profiles.forEach(p => Object.assign(this._aspects, p));
        return this;
    }
    reset(): this {
        this._aspects = {};
        return this;
    }
    setEnabled(aspect: Aspect, enabled: boolean): this {
        _assertIsAspect(aspect);
        if (enabled) {
            aspect.apply(_createAspectHooks(this._aspects, aspect));
        } else {
            Object.keys(this._aspects).forEach(pointCut => {
                delete (this._aspects as any)[pointCut][aspect.name];
            });
        }

        return this;
    }
}

function _assertIsAspect(obj: Aspect) {
    if (!isFunction(obj.apply)) {
        throw new TypeError('given object is not an Aspect');
    }

    if (!obj.name) {
        throw new TypeError(`Aspect "${obj.constructor.name}" can not have null "name" attribute`);
    }
}

function _createAspectHooks(registry: AspectRegistry, aspect: Aspect): AspectHooks {
    return {
        annotations(...annotations: Annotation[]): AnnotationAspectPointcuts {
            return {
                class: _createPointcutHooks(annotations),
                method: _createPointcutHooks(annotations),
                parameter: _createPointcutHooks(annotations),
                property: _createPointcutHooks(annotations),
            };
        },
    };

    function _createPointcutHooks(annotations: Annotation[]): PointCutHooks {
        const pointCutHooks: PointCutHooks = POINTCUT_NAMES.reduce((acc, c) => {
            acc[c] = function(advice: Advice<any>) {
                return applyFn(advice, c);
            };
            return acc;
        }, {} as PointCutHooks);

        return pointCutHooks;

        function applyFn(advice: Advice<unknown>, pointcutName: keyof PointCutHooks): PointCutHooks {
            assert(aspect instanceof Aspect);

            annotations.forEach(annotation => {
                getOrDefault(registry, _annotationKey(annotation), () => ({}));
                if (registry[_annotationKey(annotation)][aspect.name]) {
                    const oldAspect = Object.values(registry[_annotationKey(annotation)][aspect.name])[0]?.aspect;
                    console.warn(
                        `Aspect ${aspect.constructor.name} overrides aspect "${oldAspect?.constructor.name ??
                            'unknown'}" already registered for name ${aspect.name}`,
                    );
                }
                getOrDefault(registry[_annotationKey(annotation)], aspect.name, () => ({}))[pointcutName] = {
                    aspect,
                    advice,
                };
            });
            return pointCutHooks;
        }
    }
}

function _annotationKey(annotation: Annotation): string {
    return `${annotation.groupId}.${annotation.name}`;
}
