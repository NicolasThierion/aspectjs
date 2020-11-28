import {
    AnnotationLocationFactory,
    AnnotationRegistry,
    AnnotationTargetFactory,
    _getWeaverContext,
    RootAnnotationsBundle,
    _setWeaverContext,
    Weaver,
    WeaverContext,
    AspectsRegistry,
} from '@aspectjs/core/commons';
import { WeaverContextImpl } from './weaver/weaver-context.impl';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
let _AspectsRegistry: AspectsRegistry;
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
        return _getWeaverContext().aspects;
    }
    get annotations() {
        return _getWeaverContext().annotations;
    }

    getWeaver(): Weaver {
        return _getWeaverContext().getWeaver();
    }
})();
_setWeaverContext(new WeaverContextImpl());
