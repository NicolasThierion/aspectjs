import { Weaver } from './weaver';
import { AnnotationRegistry } from '../annotation/registry/annotation.registry';
import { AnnotationTargetFactory } from '../annotation/target/annotation-target.factory';
import { RootAnnotationsBundle } from '../annotation/bundle/bundle';
import { AnnotationLocationFactory } from '../annotation/location/location.factory';
import { AspectsRegistry } from '../aspect/aspect-registry';

/**
 * @public
 */
export interface WeaverContext {
    readonly aspects: {
        registry: AspectsRegistry;
    };
    readonly annotations: {
        location: AnnotationLocationFactory;
        registry: AnnotationRegistry;
        targetFactory: AnnotationTargetFactory;
        bundle: RootAnnotationsBundle;
    };

    /**
     * Get the global weaver
     */
    getWeaver(): Weaver;
}

let _weaverContext: WeaverContext;
export function getWeaverContext(): WeaverContext {
    return _weaverContext;
}

export function setWeaverContext(weaverContext: WeaverContext) {
    _weaverContext = weaverContext;
}
