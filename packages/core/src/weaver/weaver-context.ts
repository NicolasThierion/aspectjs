import { Weaver } from './weaver';
import { AdvicesRegistry } from '../advice/advice-registry';
import { AnnotationRegistry } from '../annotation/registry/annotation.registry';
import { AnnotationTargetFactory } from '../annotation/target/annotation-target.factory';
import { AnnotationBundleRegistry, RootAnnotationsBundle } from '../annotation/bundle/bundle';
import { AnnotationLocationFactory } from '../annotation/location/location.factory';

const targetFactory = new AnnotationTargetFactory();

const bundleRegistry: AnnotationBundleRegistry = {
    byTargetClassRef: {},
    byAnnotation: {},
};

export class WeaverContext {
    private _weaver: Weaver;

    readonly annotations = {
        location: new AnnotationLocationFactory(targetFactory),
        registry: new AnnotationRegistry(targetFactory, bundleRegistry),
        targetFactory: targetFactory,
        bundle: new RootAnnotationsBundle(bundleRegistry),
    };

    readonly advices = {
        registry: new AdvicesRegistry(),
    };

    getWeaver(): Weaver {
        return this._weaver;
    }
    setWeaver(weaver: Weaver): void {
        this._weaver = weaver;
    }
}
export const WEAVER_CONTEXT = new WeaverContext();
