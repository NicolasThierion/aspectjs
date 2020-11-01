import { WEAVER_CONTEXT } from './weaver/weaver-context';
import { JitWeaver } from './weaver/jit/jit-weaver';

export * from './weaver/profile';
export * from './weaver/types';
export * from './weaver/weaver';
export * from './weaver/errors/weaving-error';
export * from './weaver/errors/advice-error';
export * from './weaver/errors/aspect-error';
export * from './advice/advice-context';
export * from './advice/advice-registry';
export * from './advice/aspect';
export * from './advice/pointcut';
export * from './advice/types';
export * from './advice/compile/compile.annotation';
export * from './advice/before/before.annotation';
export * from './advice/around/around.annotation';
export * from './advice/after-return/after-return.annotation';
export * from './advice/after-throw/after-throw.annotation';
export * from './advice/after/after.annotation';
export * from './weaver/jit/jit-weaver';
export * from './annotation/annotation.types';
export * from './annotation/bundle/bundle';
export * from './annotation/context/annotation-context';
export * from './annotation/factory/annotation-factory';
export * from './annotation/target/annotation-target';

export function setupAspectWeaver() {
    WEAVER_CONTEXT.setWeaver(new JitWeaver());
}
