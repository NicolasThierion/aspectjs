import { Aspect, Compile } from '@aspectjs/core/annotations';
import { on, AnnotationFactory } from '@aspectjs/core/commons';
import { _setWeaverContext, Weaver, WeaverContext, WeavingError } from '../../../commons/src/weaver';
import { WeaverContextImpl } from '../weaver-context.impl';

let weaver: Weaver;

function setupTestingWeaverContext(): WeaverContext {
    const context = new WeaverContextImpl();
    _setWeaverContext(context);
    return context;
}

/**
 * Dummy annotation useful for tests
 * @public
 */
export const AClass = new AnnotationFactory('tests').create(function AClass(): ClassDecorator {
    return;
});

describe('JitWeaver', () => {
    beforeEach(() => {
        weaver = setupTestingWeaverContext().getWeaver();
    });

    describe('.enable()', () => {
        describe('after any annotation has been applied already', () => {
            it('should throw an error', () => {
                @AClass()
                class A {}

                @Aspect()
                class LateCompileAspectA {
                    @Compile(on.class.withAnnotations(AClass))
                    shouldThrow() {}
                }

                expect(() => {
                    weaver.enable(new LateCompileAspectA());
                }).toThrow(
                    new WeavingError(
                        'Cannot enable aspect LateCompileAspectA because annotation @AClass has already been applied',
                    ),
                );
            });
        });
    });
});
