import { Aspect } from '@aspectjs/core/annotations';
import { WeaverProfile } from './profile';
import { setupTestingWeaverContext } from '../../../testing';

describe('WeaverProfile', function () {
    let testAspect: any;
    let TestAspect: any;
    beforeEach(() => {
        setupTestingWeaverContext();

        @Aspect('test')
        class _TestAspect {}
        testAspect = new _TestAspect();
        TestAspect = _TestAspect;
    });

    describe('method "getAspect"', () => {
        describe('given an aspect id', () => {
            describe('when the corresponding aspect is not enabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().getAspect('test')).toEqual(undefined);
                });
            });

            describe('when the corresponding aspect is enabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().enable(testAspect).getAspect('test')).toEqual(testAspect);
                });
            });

            describe('when the corresponding aspect is disabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().enable(testAspect).disable(testAspect).getAspect('test')).toEqual(
                        undefined,
                    );
                });
            });
        });

        describe('given an aspect class', () => {
            describe('when the corresponding aspect is not enabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().getAspect(TestAspect)).toEqual(undefined);
                });
            });

            describe('when the corresponding aspect is enabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().enable(testAspect).getAspect(TestAspect)).toEqual(testAspect);
                });
            });

            describe('when the corresponding aspect is disabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().enable(testAspect).disable(testAspect).getAspect(TestAspect)).toEqual(
                        undefined,
                    );
                });
            });
        });
    });
});
