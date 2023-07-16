import {
  ReflectContext,
  ReflectModuleConfiguration,
  _setReflectContext,
  reflectContext,
} from '@aspectjs/common';
import {
  ConstructorType,
  cloneDeep,
  getProviderName,
  getProviders,
  setDebug,
} from '@aspectjs/common/utils';

export class ReflectTestingContext extends ReflectContext {
  private extraModules: ConstructorType[] = [];
  private readonly isInit: boolean;
  baseContext: any;
  constructor(c: ReflectContext) {
    super(c);
    this.baseContext = cloneDeep(c);
    this.isInit = true;
  }

  public override apply(context: ReflectContext) {
    super.apply(context);
    return this;
  }

  public override registerModules(
    ...modules: ConstructorType<unknown>[]
  ): ReflectContext {
    super.registerModules(...modules);
    if (this.isInit) {
      this.extraModules.push(...modules);
    }
    return this;
  }

  public reset(): this {
    this.apply(cloneDeep(this.baseContext));
    // remove all providers registered by modules in extraModules
    this.extraModules
      .flatMap((m) => getProviders(m))
      .forEach((p) => {
        this.addedProviders.delete(p);

        removeArray(
          this.providersRegistry.get(getProviderName(p.provide)) ?? [],
          (el) => p == el.provider,
        );
        removeArray(
          this.providersToResolve.get(getProviderName(p.provide)) ?? [],
          (el) => p === el,
        );
      });

    // undo side-effects of factories (eg: DecoratorProviderRegistry.add())
    this.extraModules.forEach((m) => {
      (m as any)[Symbol.for('@ajs:ttd')]?.();
      this.modules.delete(m);
    });
    this.extraModules = [];
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
    context = _setReflectContext(new ReflectTestingContext(reflectContext()));
  }
  context.registerModules(...modules);
  setDebug(true);

  return reflectContext() as ReflectTestingContext & T;
};

function removeArray<T = unknown>(array: T[], match: (el: T) => boolean) {
  let i = 0;

  while (i < array.length) {
    if (match(array[i]!)) {
      array.splice(i, 1);
    } else {
      i++;
    }
  }

  return array;
}
