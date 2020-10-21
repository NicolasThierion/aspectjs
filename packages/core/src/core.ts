import { weaverContext } from './weaver/weaver-context';
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
export * from './advice/compile/compile.decorator';
export * from './advice/before/before.decorator';
export * from './advice/around/around.decorator';
export * from './advice/after-return/after-return.decorator';
export * from './advice/after-throw/after-throw.decorator';
export * from './advice/after/after.decorator';
export * from './weaver/jit/jit-weaver';
export * from './annotation/annotation.types';
export * from './annotation/bundle/bundle';
export * from './annotation/context/context';
export * from './annotation/factory/annotation-factory';
export * from './annotation/target/annotation-target';

// TODO create function "setupAspectWeaver" to avoid side effects

export function setupAspectWeaver() {
    weaverContext.setWeaver(new JitWeaver());
}
