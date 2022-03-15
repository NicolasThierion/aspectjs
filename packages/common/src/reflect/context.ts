/**
 * Returns an object to store global values across the framework
 */

import {
  type AnnotationsHooksRegistry,
  AnnotationsHooksModule,
} from '../annotation/factory/annotations-hooks.registry';
import {
  type AnnotationRegistry,
  _AnnotationRegistryModule,
} from '../annotation/registry/annotation.registry';
import { AnnotationTargetFactoryModule } from '../annotation/target/annotation-target-factory.module';
import type { AnnotationTargetFactory } from '../annotation/target/annotation-target.factory';
import type { ReflectContextModule } from './reflect-context-module.type';

type KnownReflectContextDependencies = {
  annotationsHooksRegistry: AnnotationsHooksRegistry;
  annotationRegistry: AnnotationRegistry;
  annotationTargetFactory: AnnotationTargetFactory;
};
export type ReflectContextModules = {
  [name: string]: ReflectContextModule<any>;
};
export class ReflectContext {
  protected bootstraped = false;
  protected modules: ReflectContextModules = {
    annotationRegistry: new _AnnotationRegistryModule(),
    annotationsHooksRegistry: new AnnotationsHooksModule(),
    annotationTargetFactory: new AnnotationTargetFactoryModule(),
  };
  protected deps: {
    [T: keyof ReflectContextModules]: any;
  } = {};

  constructor(modules: Partial<ReflectContextModules> = {}) {
    Object.assign(this.modules, modules);
  }

  bootstrap(reflectContextModules?: Partial<ReflectContextModules>) {
    if (this.bootstraped) {
      throw new Error(`ReflectContext already bootstrapped`);
    }
    Object.assign(this.modules, reflectContextModules);

    this.bootstraped = true;

    this.deps = Object.entries(
      this.modules as Record<string, ReflectContextModule<any>>
    )
      .filter(([_name, m]) => typeof m.bootstrap === 'function')
      .sort(
        ([_n1, m1], [_n2, m2]) =>
          (m1.order ?? Number.MAX_SAFE_INTEGER) -
          (m2.order ?? Number.MAX_SAFE_INTEGER)
      )
      .reduce((deps, [name, m]) => {
        deps[name] = m.bootstrap?.(this);
        return deps;
      }, this.deps);

    return this;
  }
  get<
    T extends KnownReflectContextDependencies[N],
    N extends keyof KnownReflectContextDependencies = keyof KnownReflectContextDependencies
  >(name: N): T;

  get<
    T extends KnownReflectContextDependencies[N],
    N extends keyof KnownReflectContextDependencies = keyof KnownReflectContextDependencies
  >(name: N): T;
  get<
    T extends KnownReflectContextDependencies[N],
    N extends keyof KnownReflectContextDependencies = keyof KnownReflectContextDependencies
  >(name: N, defaultValue: () => T): T;
  get<
    T extends KnownReflectContextDependencies[N],
    N extends keyof KnownReflectContextDependencies = keyof KnownReflectContextDependencies
  >(name: N, defaultValue?: () => T): T {
    if (!this.bootstraped) {
      this.bootstrap();
    }
    const dep = this.deps[name] ?? (this.deps[name] = defaultValue?.());
    if (!dep) {
      throw new Error(`no dependency with name ${name}`);
    }

    return dep as any;
  }

  static configureTesting(
    reflectContextModules?: Partial<ReflectContextModules>
  ): TestingContext {
    return (_context = new TestingContext(reflectContextModules));
  }
}

export class TestingContext extends ReflectContext {
  readonly defaultModules = this.modules;
  readonly defaultDeps = this.deps;

  reset() {
    this.modules = { ...this.defaultModules };
    this.deps = { ...this.defaultDeps };
    this.bootstraped = false;
    return this;
  }
}
let _context: ReflectContext = new ReflectContext();

export const bootstrapReflectContext = (
  reflectContextModules?: Partial<ReflectContextModules>
): ReflectContext => {
  return _context.bootstrap(reflectContextModules);
};

export const reflectContext = () => _context;
