import {
    AnnotationBundleRegistry,
    AnnotationLocationFactory,
    AnnotationRegistry,
    AnnotationTargetFactory,
    AspectsRegistry,
    RootAnnotationsBundle,
    Weaver,
    WeaverContext,
} from '@aspectjs/core/commons';
import { AspectsRegistryImpl } from '../aspect/aspect.registry.impl';
import { JitWeaver } from './jit-weaver';

const bundleRegistry: AnnotationBundleRegistry = {
    byTargetClassRef: {},
    byAnnotation: {},
};

const bundle = new RootAnnotationsBundle(bundleRegistry);
const annotationRegistry = new AnnotationRegistry(bundleRegistry);
/**
 * @public
 */
export class WeaverContextImpl implements WeaverContext {
    private readonly _weaver = new JitWeaver(this);
    private readonly _targetFactory = new AnnotationTargetFactory();

    readonly aspects: { registry: AspectsRegistry };

    readonly annotations = {
        location: new AnnotationLocationFactory(this._targetFactory),
        registry: annotationRegistry,
        targetFactory: this._targetFactory,
        bundle,
    };

    constructor() {
        this.aspects = {
            registry: new AspectsRegistryImpl(this),
        };
    }
    /**
     * Get the global weaver
     */
    getWeaver(): Weaver {
        return this._weaver;
    }
}
