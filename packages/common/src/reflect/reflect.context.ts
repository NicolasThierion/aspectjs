/**
 * Returns an object to store global values across the framework
 */

import { assert, setDebug } from '@aspectjs/common/utils';
import { _AnnotationsFactoryHooksRegistryModule } from '../annotation/factory/annotation-factory.module';
import { _AnnotationRegistryModule } from '../annotation/registry/annotation-registry.module';
import { _AnnotationTargetFactoryModule } from '../annotation/target/annotation-target-factory.module';
import type { ReflectContextModule } from './reflect-context-module.type';
import type { KnownReflectContextProviders } from './reflect-known-providers';

export interface ReflectContextProviders extends KnownReflectContextProviders {
  [k: string]: any;
}

export class ReflectContext {
  protected bootstrapped = false;
  protected modules: ReflectContextModule[] = [
    new _AnnotationRegistryModule(),
    new _AnnotationsFactoryHooksRegistryModule(),
    new _AnnotationTargetFactoryModule(),
  ];
  protected providers: ReflectContextProviders = {} as ReflectContextProviders;

  bootstrap() {
    if (this.bootstrapped) {
      throw new Error(`ReflectContext already bootstrapped`);
    }

    this.bootstrapped = true;

    this.modules
      .sort(
        (m1, m2) =>
          (m1.order ?? Number.MAX_SAFE_INTEGER) -
          (m2.order ?? Number.MAX_SAFE_INTEGER),
      )
      .forEach((m) => m.bootstrap(this));

    return this;
  }

  addModules(...modules: ReflectContextModule[]) {
    assert(!this.bootstrapped);
    this.modules.push(...modules);
    return this;
  }

  set<
    T extends KnownReflectContextProviders[N],
    N extends keyof KnownReflectContextProviders = keyof KnownReflectContextProviders,
  >(name: N, provider: T): void;
  set<T = unknown, N extends string = string>(name: N, provider: T): void;
  set<T, N extends string>(name: N, provider: T): void {
    if (this.providers[name]) {
      console.warn(
        `Provider ${
          Object.getPrototypeOf(this.get(name)).constructor.name
        } already registered for name "${name}"`,
      );
    }

    this.providers[name] = provider;
  }

  get<
    T extends KnownReflectContextProviders[N],
    N extends keyof KnownReflectContextProviders = keyof KnownReflectContextProviders,
  >(name: N): T;
  get<T = unknown, N extends string = string>(name: N): T;
  get<T, N extends string>(name: N): T {
    if (!this.bootstrapped) {
      this.bootstrap();
    }
    const provider = this.providers[name];
    if (!provider) {
      throw new Error(`No ReflectContext provider with name ${name}`);
    }

    return provider as any;
  }

  has<
    N extends keyof KnownReflectContextProviders = keyof KnownReflectContextProviders,
  >(name: N): boolean {
    if (!this.bootstrapped) {
      this.bootstrap();
    }
    const provider = this.providers[name];
    return !!provider;
  }

  static configureTesting(
    reflectContextModules: ReflectContextModule[] = [],
  ): TestingReflectContext {
    setDebug(true);

    return (_context = new TestingReflectContext().addModules(
      ...reflectContextModules,
    ));
  }
}

export class TestingReflectContext extends ReflectContext {
  readonly defaultModules = this.modules;
  readonly defaultProviders = this.providers;

  reset() {
    this.modules = [...this.defaultModules];
    this.providers = { ...this.defaultProviders };
    this.bootstrapped = false;
    return this;
  }
}

let _context: ReflectContext = new ReflectContext();
export const reflectContext = () => _context;