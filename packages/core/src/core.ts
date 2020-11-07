import { getWeaverContext, setWeaverContext, Weaver, WeaverContext } from '@aspectjs/core/internals/src/weaver';
import { WeaverContextImpl } from '@aspectjs/core/internals/src/weaver/weaver-context.impl';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
import { AnnotationLocationFactory } from '@aspectjs/core/internals/src/annotation/location/location.factory';
import { AnnotationRegistry } from '@aspectjs/core/internals/src/annotation/registry/annotation.registry';
import { AnnotationTargetFactory } from '@aspectjs/core/internals/src/annotation/target/annotation-target.factory';
import { RootAnnotationsBundle } from '@aspectjs/core/internals/src/annotation/bundle/bundle';

AnnotationLocationFactory;
AnnotationRegistry;
AnnotationTargetFactory;
RootAnnotationsBundle;
/**
 * @public
 */
export const WEAVER_CONTEXT = new (class implements WeaverContext {
    // Allow setWeaverContext to switch implementation of weaver.
    // This is used for resetWaverContext as a convenience for tests
    get aspects() {
        return getWeaverContext().aspects;
    }
    get annotations() {
        return getWeaverContext().annotations;
    }

    getWeaver(): Weaver {
        return getWeaverContext().getWeaver();
    }
})();
setWeaverContext(new WeaverContextImpl());

export * from '@aspectjs/core/internals/src/weaver';
