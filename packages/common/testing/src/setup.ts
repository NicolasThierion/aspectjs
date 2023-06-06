import {
  ReflectContext,
  reflectContext,
  ReflectModule,
  _setReflectContext,
} from '@aspectjs/common';
import { cloneDeep, setDebug } from '@aspectjs/common/utils';

export class ReflectTestingContext extends ReflectContext {
  baseContext: ReflectContext;
  constructor(context?: ReflectContext) {
    super(context);
    this.baseContext = cloneDeep(context);
  }

  public override apply(context: ReflectContext) {
    super.apply(context);
    return this;
  }

  public override reset(): this {
    super.reset();
    return this.apply(cloneDeep(this.baseContext));
  }
}

let testingContext: ReflectTestingContext;
export const configureTesting = <T extends ReflectModule = ReflectModule>(
  context?: ReflectContext,
) => {
  // save the previous context before setting up a TestingContext
  if (!testingContext) {
    testingContext = new ReflectTestingContext(reflectContext());
  } else {
    // reset context to saved state
    testingContext.reset();
  }
  if (context) {
    testingContext.apply(context);
  }

  setDebug(true);
  _setReflectContext(testingContext);

  return testingContext as ReflectTestingContext & T;
};
