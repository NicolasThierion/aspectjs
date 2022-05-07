/**
 * Returns an object to store global values across the framework
 */

import { assert } from '@aspectjs/common/utils';
import { _AnnotationsFactoryHooksRegistryModule } from '../annotation/factory/annotation-factory.module';
import type { _AnnotationFactoryHooksRegistry } from '../annotation/factory/annotations-hooks.registry';
import {
  type AnnotationRegistry,
  _AnnotationRegistryModule,
} from '../annotation/registry/annotation.registry';
import { AnnotationTargetFactoryModule } from '../annotation/target/annotation-target-factory.module';
import type { AnnotationTargetFactory } from '../annotation/target/annotation-target.factory';
import type { ReflectContextModule } from './reflect-context-module.type';

interface KnownReflectContextProviders {
  annotationFactoryHooksRegistry: _AnnotationFactoryHooksRegistry;
  annotationRegistry: AnnotationRegistry;
  annotationTargetFactory: AnnotationTargetFactory;
}

export interface ReflectContextProviders extends KnownReflectContextProviders {
  [k: string]: any;
}

export class ReflectContext {
  protected bootstrapped = false;
  protected modules: ReflectContextModule[] = [
    new _AnnotationRegistryModule(),
    new _AnnotationsFactoryHooksRegistryModule(),
    new AnnotationTargetFactoryModule(),
  ];
  protected providers: ReflectContextProviders = {} as ReflectContextProviders;

  constructor(modules: ReflectContextModule[] = []) {
    this.modules.push(...modules);
  }

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
  }

  set<
    T extends KnownReflectContextProviders[N],
    N extends keyof KnownReflectContextProviders = keyof KnownReflectContextProviders,
  >(name: N, provider: T): void {
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
  >(name: N): T {
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
    reflectContextModules?: ReflectContextModule[],
  ): TestingContext {
    return (_context = new TestingContext(reflectContextModules));
  }
}

export class TestingContext extends ReflectContext {
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
