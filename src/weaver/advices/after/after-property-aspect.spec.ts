// import { Aspect } from '../../types';
// import { AfterAdvice } from '../types';
// import { ClassAnnotation, PropertyAnnotation, setWeaver } from '../../../index';
// import { After } from './after.decorator';
// import { AdviceContext, AfterContext } from '../advice-context';
// import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
// import { AnnotationFactory } from '../../../annotation/factory/factory';
//
// export const AProperty = new AnnotationFactory('tests').create(function AClass(): PropertyDecorator {
//     return;
// });
//
// interface Labeled {
//     labels?: string[];
// }
//
// function setupWeaver(...aspects: Aspect[]): void {
//     const weaver = new LoadTimeWeaver().enable(...aspects);
//     setWeaver(weaver);
//     weaver.load();
// }
//
// let afterAdvice: AfterAdvice<any> = ctxt => {
//     throw new Error('should configure afterThrowAdvice');
// };
//
// describe('given a class configured with some property-annotation aspects', () => {
//     describe('that leverage "after" pointcut', () => {
//         beforeEach(() => {
//             class AfterAspect extends Aspect {
//                 name = 'APropertyLabel';
//
//                 @After(AProperty)
//                 apply(ctxt: AdviceContext<any, PropertyAnnotation>): void {
//                     afterAdvice(ctxt);
//                 }
//             }
//
//             afterAdvice = jasmine
//                 .createSpy('afterAdvice', function(ctxt: AfterContext<any, PropertyAnnotation>) {
//                     throw new Error('not implemented');
//                     ctxt.instance.labels = ctxt.instance.labels ?? [];
//                     ctxt.instance.labels.push('AProperty');
//                 })
//                 .and.callThrough();
//
//             setupWeaver(new AfterAspect());
//         });
//
//         describe('creating an instance of this class', () => {
//             it('should invoke the aspect', () => {
//                 class A implements Labeled {
//                     @AProperty()
//                     labels?: string[];
//                 }
//
//                 const instance = new A() as Labeled;
//                 const labels = instance.labels;
//                 expect(labels).toBeDefined();
//                 expect(labels).toEqual(['AClass']);
//             });
//
//             it('should produce a class of the same class instance', () => {
//                 @AClass()
//                 class A implements Labeled {}
//
//                 const instance = new A();
//                 expect(instance instanceof A).toBeTrue();
//             });
//             it('should call the original constructor after the aspect', () => {
//                 @AClass()
//                 class A implements Labeled {
//                     labels: string[];
//                     constructor() {
//                         this.labels = (this.labels ?? []).concat('ctor');
//                     }
//                 }
//
//                 const labels = (new A() as Labeled).labels;
//                 expect(labels).toBeDefined();
//                 expect(labels).toEqual(['ctor', 'AClass']);
//             });
//
//             it('should pass down the constructor argument', () => {
//                 @AClass()
//                 class A implements Labeled {
//                     labels: string[];
//                     constructor(lbl: string) {
//                         this.labels = (this.labels ?? []).concat(lbl);
//                     }
//                 }
//
//                 const labels = (new A('lbl') as Labeled).labels;
//                 expect(labels).toBeDefined();
//                 expect(labels).toEqual(['lbl', 'AClass']);
//             });
//
//             describe('when the constructor throws', () => {
//                 it('should call the "after" advice', () => {
//                     @AClass()
//                     class A {
//                         constructor() {
//                             throw new Error('');
//                         }
//                     }
//                     expect(afterAdvice).not.toHaveBeenCalled();
//
//                     try {
//                         new A();
//                     } catch (e) {}
//                     expect(afterAdvice).toHaveBeenCalled();
//                 });
//             });
//         });
//     });
// });
