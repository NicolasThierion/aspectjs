import {
    getWeaver,
    Aspect,
    Compile,
    on,
    AfterContext,
    AfterReturnContext,
    AfterThrowContext,
    AroundContext,
    BeforeContext,
    AnnotationType,
    Before,
    Around,
    After,
    AfterReturn,
    AfterThrow,
    LoadTimeWeaver,
    setWeaver,
    AnnotationFactory,

export interface Labeled {
    labels?: string[];
    addLabel?: (...args: any[]) => any;
}

export function setupWeaver(...aspects: object[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

export const AClass = new AnnotationFactory('tests').create(function AClass(): ClassDecorator {
    return;
});

export const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
    return;
});

export const AMethod = new AnnotationFactory('tests').create(function AMethod(): MethodDecorator {
    return;
});

export const AParameter = new AnnotationFactory('tests').create(function AParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});

describe('AspectJS', () => {
    it('should define a "getWeaver() function', () => {
        expect(getWeaver).toBeDefined();
        expect(getWeaver).toEqual(jasmine.any(Function));
    });

    describe('given several aspects', () => {
        let labels: string[];

        beforeEach(() => {
            labels = [];
        });

        describe('that do not specify a priority', () => {
            beforeEach(() => {
                setupWeaver(new LabelAspect('A'), new LabelAspect('B'));
            });

            @Aspect()
            class LabelAspect {
                constructor(public id: string) {}

                @Compile(on.class.withAnnotations(AClass))
                compileClass(ctxt: BeforeContext<Labeled, AnnotationType.CLASS>) {
                    const id = this.id;
                    return function() {
                        labels.push(`${id}_compileClass`);
                    };
                }

                @Before(on.class.withAnnotations(AClass))
                beforeClass(ctxt: BeforeContext<Labeled, AnnotationType.CLASS>) {
                    labels.push(`${this.id}_beforeClass`);
                }

                @Around(on.class.withAnnotations(AClass))
                aroundClass(ctxt: AroundContext<Labeled, AnnotationType.CLASS>) {
                    labels.push(`${this.id}_AroundClass`);
                    return ctxt.joinpoint();
                }

                @After(on.class.withAnnotations(AClass))
                afterClass(ctxt: AfterContext<Labeled, AnnotationType.CLASS>) {
                    labels.push(`${this.id}_AfterClass`);
                }

                @AfterReturn(on.class.withAnnotations(AClass))
                afterReturnClass(ctxt: AfterReturnContext<Labeled, AnnotationType.CLASS>) {
                    labels.push(`${this.id}_AfterReturnClass`);
                    return ctxt.value;
                }

                @AfterThrow(on.class.withAnnotations(AClass))
                afterThrowClass(ctxt: AfterThrowContext<Labeled, AnnotationType.CLASS>) {
                    labels.push(`${this.id}_AfterThrowClass`);
                    throw ctxt.error;
                }

                @Compile(on.property.withAnnotations(AProperty))
                compileProperty(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
                    const id = this.id;

                    return {
                        get() {
                            labels.push(`${id}_compilePropertyGet`);
                        },
                        set() {
                            labels.push(`${id}_compilePropertySet`);
                        },
                    };
                }

                @Before(on.property.withAnnotations(AProperty))
                beforeProperty(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
                    labels.push(`${this.id}_beforePropertyGet`);
                }

                @Around(on.property.withAnnotations(AProperty))
                aroundProperty(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
                    labels.push(`${this.id}_AroundPropertyGet`);
                    return ctxt.joinpoint();
                }

                @After(on.property.withAnnotations(AProperty))
                afterProperty(ctxt: AfterContext<Labeled, AnnotationType.PROPERTY>) {
                    labels.push(`${this.id}_AfterPropertyGet`);
                }

                @AfterReturn(on.property.withAnnotations(AProperty))
                afterReturnProperty(ctxt: AfterReturnContext<Labeled, AnnotationType.PROPERTY>) {
                    labels.push(`${this.id}_AfterReturnPropertyGet`);
                    return ctxt.value;
                }

                @AfterThrow(on.property.withAnnotations(AProperty))
                afterThrowProperty(ctxt: AfterThrowContext<Labeled, AnnotationType.PROPERTY>) {
                    labels.push(`${this.id}_AfterThrowPropertyGet`);
                    throw ctxt.error;
                }

                @Before(on.property.setter.withAnnotations(AProperty))
                beforePropertySet(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
                    labels.push(`${this.id}_beforePropertySet`);
                }

                @Around(on.property.setter.withAnnotations(AProperty))
                aroundPropertySet(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
                    labels.push(`${this.id}_AroundPropertySet`);
                    return ctxt.joinpoint();
                }

                @After(on.property.setter.withAnnotations(AProperty))
                afterPropertySet(ctxt: AfterContext<Labeled, AnnotationType.PROPERTY>) {
                    labels.push(`${this.id}_AfterPropertySet`);
                }

                @AfterReturn(on.property.setter.withAnnotations(AProperty))
                afterReturnPropertySet(ctxt: AfterReturnContext<Labeled, AnnotationType.PROPERTY>) {
                    labels.push(`${this.id}_AfterReturnPropertySet`);
                }

                @AfterThrow(on.property.setter.withAnnotations(AProperty))
                afterThrowPropertySet(ctxt: AfterThrowContext<Labeled, AnnotationType.PROPERTY>) {
                    labels.push(`${this.id}_AfterThrowPropertySet`);
                    throw ctxt.error;
                }
            }

            describe('constructing a class instance', () => {
                let A: any;

                beforeEach(() => {
                    @AClass()
                    // eslint-disable-next-line @typescript-eslint/class-name-casing
                    class A_ {
                        @AProperty()
                        labels: string[];
                    }

                    A = A_;
                });

                it('should apply advices across all aspects in order', () => {
                    expect(labels).toEqual([]);
                    const a = new A();
                    const expectedLabels = [
                        'A_beforeClass',
                        'B_beforeClass',
                        'A_AroundClass',
                        'B_AroundClass',
                        'B_compileClass',
                        'A_AfterReturnClass',
                        'B_AfterReturnClass',
                        'A_AfterClass',
                        'B_AfterClass',
                        // 'A_AfterThrowClass',
                        // 'B_AfterThrowClass',
                    ];

                    expect(labels).toEqual(expectedLabels);

                    console.log(a.labels);
                    expectedLabels.push(
                        'A_beforePropertyGet',
                        'B_beforePropertyGet',
                        'A_AroundPropertyGet',
                        'B_AroundPropertyGet',
                        'B_compilePropertyGet',
                        'A_AfterReturnPropertyGet',
                        'B_AfterReturnPropertyGet',
                        'A_AfterPropertyGet',
                        'B_AfterPropertyGet',
                        // 'A_AfterThrowPropertyGet',
                        // 'B_AfterThrowPropertyGet',
                    );

                    expect(labels).toEqual(expectedLabels);
                    a.labels = [];

                    expectedLabels.push(
                        'A_beforePropertySet',
                        'B_beforePropertySet',
                        'A_AroundPropertySet',
                        'B_AroundPropertySet',
                        'B_compilePropertySet',
                        'A_AfterReturnPropertySet',
                        'B_AfterReturnPropertySet',
                        'A_AfterPropertySet',
                        'B_AfterPropertySet',
                        // 'A_AfterThrowPropertySet',
                        // 'B_AfterThrowPropertySet',
                    );

                    expect(labels).toEqual(expectedLabels);
                });
            });
        });
        describe('when the advices specify a priority', () => {
            let a: Labeled;
            beforeEach(() => {
                @Aspect()
                class AAspect {
                    @Before(on.class.withAnnotations(AClass), { priority: 10 })
                    beforeProperty(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
                        labels.push('A_beforeClass');
                    }

                    @Around(on.property.withAnnotations(AProperty), { priority: 10 })
                    aroundProperty(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
                        labels.push('A_AroundPropertyGet');
                        return ctxt.joinpoint();
                    }
                }

                @Aspect()
                class BAspect {
                    @Before(on.class.withAnnotations(AClass), { priority: 20 })
                    beforeProperty(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
                        labels.push('B_beforeClass');
                    }

                    @Around(on.property.withAnnotations(AProperty), { priority: 20 })
                    aroundProperty(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
                        labels.push('B_AroundPropertyGet');
                        return ctxt.joinpoint();
                    }
                }

                setupWeaver(new AAspect(), new BAspect());
            });
            it('should call the advices in priority order', () => {
                @AClass()
                class A implements Labeled {
                    @AProperty()
                    labels: string[];
                }

                expect(labels).toEqual([]);
                a = new A();
                expect(labels).toEqual(['B_beforeClass', 'A_beforeClass']);
                console.log(a.labels);
                expect(labels).toEqual([
                    'B_beforeClass',
                    'A_beforeClass',
                    'B_AroundPropertyGet',
                    'A_AroundPropertyGet',
                ]);
            });
        });
        describe('when the aspects specify a priority', () => {
            let a: Labeled;
            beforeEach(() => {
                @Aspect({ priority: 10 })
                class AAspect {
                    @Before(on.class.withAnnotations(AClass))
                    beforeProperty(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
                        labels.push('A_beforeClass');
                    }

                    @Around(on.property.withAnnotations(AProperty))
                    aroundProperty(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
                        labels.push('A_AroundPropertyGet');
                        return ctxt.joinpoint();
                    }
                }

                @Aspect({ priority: 20 })
                class BAspect {
                    @Before(on.class.withAnnotations(AClass))
                    beforeProperty(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
                        labels.push('B_beforeClass');
                    }

                    @Around(on.property.withAnnotations(AProperty))
                    aroundProperty(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
                        labels.push('B_AroundPropertyGet');
                        return ctxt.joinpoint();
                    }
                }

                setupWeaver(new AAspect(), new BAspect());
            });
            it('should call the advices in priority order', () => {
                @AClass()
                class A implements Labeled {
                    @AProperty()
                    labels: string[];
                }

                expect(labels).toEqual([]);
                a = new A();
                expect(labels).toEqual(['B_beforeClass', 'A_beforeClass']);
                console.log(a.labels);
                expect(labels).toEqual([
                    'B_beforeClass',
                    'A_beforeClass',
                    'B_AroundPropertyGet',
                    'A_AroundPropertyGet',
                ]);
            });
        });
    });
});
