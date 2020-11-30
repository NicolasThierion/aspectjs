import { ObservableMemoSupportAspect } from '@aspectjs/memo/support/observables';
import { WEAVER_CONTEXT } from '@aspectjs/core';

WEAVER_CONTEXT.getWeaver().enable(new ObservableMemoSupportAspect());
