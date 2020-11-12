import { AfterContext } from './after/after.context';
import { BeforeContext } from './before/before.context';
import { AfterReturnContext } from './after-return/after-return.context';
import { AfterThrowContext } from './after-throw/after-throw.context';
import { AroundContext } from './around/around.context';
import { CompileContext } from './compile/compile.context';
import { AdviceType } from './types';

/**
 * @public
 */
export type AdviceContext<T = unknown, A extends AdviceType = any> =
    | AfterContext<T, A>
    | BeforeContext<T, A>
    | AfterReturnContext<T, A>
    | AfterThrowContext<T, A>
    | AroundContext<T, A>
    | CompileContext<T, A>;

/**
 * @public
 */
export { AfterContext, BeforeContext, AfterReturnContext, AfterThrowContext, AroundContext, CompileContext };
