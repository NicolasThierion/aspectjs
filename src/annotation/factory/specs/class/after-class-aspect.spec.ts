import { Aspect, AspectHooks } from '../../../../weaver/types';
import { AClass } from '../../../../tests/a';
import { AnnotationContext } from '../../../context/context';
import { Weaver } from '../../../../weaver/load-time/load-time-weaver';
import { setWeaver } from '../../../../index';
import { AAspect } from '../../../../tests/a/a.aspect';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new Weaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "after" pointcut', () => {
        let aaspect: AAspect;
        beforeEach(() => {
            class AAspect extends Aspect {
                name = 'AClassLabel';

                addLabels(ctxt: AnnotationContext<any, ClassDecorator>): void {
                    ctxt.instance.labels = ctxt.instance.labels ?? [];
                    ctxt.instance.labels.push('AClass');
                }

                apply(hooks: AspectHooks): void {
                    hooks.annotations(AClass).class.after(this.addLabels);
                }
            }
            aaspect = new AAspect();
            spyOn(aaspect, 'addLabels').and.callThrough();
            setupWeaver(aaspect);
        });
        describe('creating an instance of this class', () => {
            it('should invoke the aspect', () => {
                @AClass()
                class A implements Labeled {}

                const instance = new A() as Labeled;
                const labels = instance.labels;
                expect(labels).toBeDefined();
                expect(labels).toEqual(['AClass']);
            });

            it('should produce a class of the same class instance', () => {
                @AClass()
                class A implements Labeled {}

                const instance = new A();
                expect(instance instanceof A).toBeTrue();
            });
            it('should call the original constructor after the aspect', () => {
                @AClass()
                class A implements Labeled {
                    labels: string[];
                    constructor() {
                        this.labels = (this.labels ?? []).concat('ctor');
                    }
                }

                const labels = (new A() as Labeled).labels;
                expect(labels).toBeDefined();
                expect(labels).toEqual(['ctor', 'AClass']);
            });

            it('should pass down the constructor argument', () => {
                @AClass()
                class A implements Labeled {
                    labels: string[];
                    constructor(lbl: string) {
                        this.labels = (this.labels ?? []).concat(lbl);
                    }
                }

                const labels = (new A('lbl') as Labeled).labels;
                expect(labels).toBeDefined();
                expect(labels).toEqual(['lbl', 'AClass']);
            });

            describe('when the constructor throws', () => {
                it('should call the "after" advice', () => {
                    @AClass()
                    class A {
                        constructor() {
                            throw new Error('');
                        }
                    }
                    expect(aaspect.addLabels).not.toHaveBeenCalled();

                    try {
                        new A();
                    } catch (e) {}
                    expect(aaspect.addLabels).toHaveBeenCalled();
                });
            });
        });
    });
});
