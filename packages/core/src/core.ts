import {
    AnnotationLocationFactory,
    AnnotationRegistry,
    AnnotationTargetFactory,
    getWeaverContext,
    RootAnnotationsBundle,
    setWeaverContext,
    Weaver,
    WeaverContext,
    AspectsRegistry,
} from '@aspectjs/core/commons';
import { WeaverContextImpl } from './weaver/weaver-context.impl';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
let AspectsRegistry: AspectsRegistry;
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
