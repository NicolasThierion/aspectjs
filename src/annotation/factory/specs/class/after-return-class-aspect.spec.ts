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
    describe('that leverage "afterReturn" pointcut', () => {
        let aaspect: AAspect;
        beforeEach(() => {
            class AAspect extends Aspect {
                name = 'AClassLabel';

                addLabels(ctxt: AnnotationContext<any, ClassDecorator>): void {
                    ctxt.instance.labels = ctxt.instance.labels ?? [];
                    ctxt.instance.labels.push('AClass');
                }

                apply(hooks: AspectHooks): void {
                    hooks.annotations(AClass).class.afterReturn(this.addLabels);
                }
            }
            aaspect = new AAspect();
            spyOn(aaspect, 'addLabels').and.callThrough();
            setupWeaver(aaspect);
        });
        describe('creating an instance of this class', () => {
            describe('with a constructor that throws', () => {
                it('should not call the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        constructor(label: string) {
                            throw new Error('expected');
                        }
                    }

                    expect(() => {
                        new A('ctor');
                    }).toThrow();
                    expect(aaspect.addLabels).not.toHaveBeenCalled();
                });
            });

            describe('with a constructor that do not throws', () => {
                it('should call the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];
                        }
                    }

                    const labels = new A('ctor').labels;
                    expect(aaspect.addLabels).toHaveBeenCalled();
                    expect(labels).toEqual(['ctor', 'AClass']);
                });
            });
        });
    });
});
