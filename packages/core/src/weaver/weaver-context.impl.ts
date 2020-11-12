import {
    AnnotationTargetFactory,
    AnnotationBundleRegistry,
    RootAnnotationsBundle,
    AnnotationRegistry,
    WeaverContext,
    AspectsRegistry,
    AnnotationLocationFactory,
    Weaver,
} from '@aspectjs/core/commons';
import { AspectsRegistryImpl } from '../aspect/aspect.registry.impl';
import { JitWeaver } from './jit-weaver';

const targetFactory = new AnnotationTargetFactory();
const bundleRegistry: AnnotationBundleRegistry = {
    byTargetClassRef: {},
    byAnnotation: {},
};

const bundle = new RootAnnotationsBundle(bundleRegistry, targetFactory);
const annotationRegistry = new AnnotationRegistry(targetFactory, bundleRegistry);
/**
 * @public
 */
export class WeaverContextImpl implements WeaverContext {
    private readonly _weaver = new JitWeaver(this);

    readonly aspects: { registry: AspectsRegistry };

    readonly annotations = {
        location: new AnnotationLocationFactory(targetFactory),
        registry: annotationRegistry,
        targetFactory,
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
