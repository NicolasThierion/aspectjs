import { AnnotationLocation, AnnotationLocationFactory } from '../location/location';
import { AnnotationBundleRegistry } from '../bundle/bundle-factory';

export class AnnotationRegistry {
    static getContext(location: AnnotationLocation<any, any>) {
        return AnnotationBundleRegistry.of(AnnotationLocationFactory.getTarget(location)).at(location);
    }
}
