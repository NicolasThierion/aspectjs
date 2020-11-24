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
import { JitWeaver } from './jit/jit-weaver';

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
    readonly weaver: Weaver;
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

        this.weaver = this._createWeaver();
    }

    protected _createWeaver(): Weaver {
        return new JitWeaver(this);
    }
    /**
     * Get the global weaver
     */
    getWeaver(): Weaver {
        return this.weaver;
    }
}
