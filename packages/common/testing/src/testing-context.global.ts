import {
  AnnotationContext,
  AnnotationContextRegistry,
  ReflectContext,
  ReflectModuleConfiguration,
  _setReflectContext,
  reflectContext,
} from '@aspectjs/common';
import { ConstructorType, setDebug } from '@aspectjs/common/utils';

export class ReflectTestingContext extends ReflectContext {
  private testedModules: Set<ConstructorType> = new Set();
  private permanentAnnotations: AnnotationContext[] = [];
  private isInit = false;
  constructor(c: ReflectContext = new ReflectContext()) {
    super();
    this.permanentAnnotations = c
      .get(AnnotationContextRegistry)
      .select()
      .all()
      .find();
    this.permanentAnnotations.forEach((c) =>
      this.get(AnnotationContextRegistry).register(c),
    );
    this.isInit = true;
  }

  public override assign(context: ReflectContext) {
    super.assign(context);
    return this;
  }

  public override registerModules(
    ...modules: ConstructorType<unknown>[]
  ): ReflectContext {
    if (this.isInit) {
      modules
        .filter((m) => !this.modules.has(m))
        .forEach((m) => {
          this.testedModules.add(m);
        });
    }

    super.registerModules(...modules);

    return this;
  }

  public reset(): this {
    // remove all providers registered by modules in extraModules
    // [...this.testedModules]
    //   .flatMap((m) => getProviders(m))
    //   .forEach((p) => {
    //     this.addedProviders.delete(p);

    //     removeArray(
    //       this.providersRegistry.get(getProviderName(p.provide)) ?? [],
    //       (el) => p == el.provider,
    //     );
    //     removeArray(
    //       this.providersToResolve.get(getProviderName(p.provide)) ?? [],
    //       (el) => p === el,
    //     );
    //   });

    // undo side-effects of factories (eg: DecoratorProviderRegistry.add())
    this.testedModules.forEach((m) => {
      (m as any)[Symbol.for('@ajs:ttd')]?.();
      this.modules.delete(m);
    });

    this.testedModules.clear();
    this.assign(new ReflectContext());

    // restore permanent annotations
    this.permanentAnnotations.forEach((c) =>
      this.get(AnnotationContextRegistry).register(c),
    );

    // this.registerModules(...this.testedModules)

    return this;
  }
}

export const configureTesting = <
  T extends ReflectModuleConfiguration = ReflectModuleConfiguration,
>(
  ...modules: ConstructorType<unknown>[]
) => {
  let context = reflectContext();
  if (context instanceof ReflectTestingContext) {
    context.reset();
  } else {
    context = _setReflectContext(new ReflectTestingContext(context));
  }
  context.registerModules(...modules);
  setDebug(true);

  return reflectContext() as ReflectTestingContext & T;
};
