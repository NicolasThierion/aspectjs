import { JitWeaver, WeaverContextImpl } from '@aspectjs/core';
import { Weaver } from '@aspectjs/core/commons';

export class TestingWeaverContext extends WeaverContextImpl {
    protected _createWeaver(): Weaver {
        return new JitWeaver(this, false);
    }
}
