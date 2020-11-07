import { Weaver } from './weaver';
import { AnnotationRegistry } from '../annotation/registry/annotation.registry';
import { AnnotationTargetFactory } from '../annotation/target/annotation-target.factory';
import { AnnotationBundleRegistry, RootAnnotationsBundle } from '../annotation/bundle/bundle';
import { AnnotationLocationFactory } from '../annotation/location/location.factory';
import { JitWeaver } from './jit/jit-weaver';
import { WeaverContext } from './weaver-context';
import { AspectsRegistry } from '../aspect/aspect-registry';

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
            registry: new AspectsRegistry(this),
        };
    }
    /**
     * Get the global weaver
     */
    getWeaver(): Weaver {
        return this._weaver;
    }
}
