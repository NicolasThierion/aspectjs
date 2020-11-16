import { WEAVER_CONTEXT } from '@aspectjs/core';
import { MemoProfile, MemoProfileFeatures } from './profiles/default.profile';

class DefaultMemoProfile extends MemoProfile {
    register() {
        WEAVER_CONTEXT.getWeaver().enable(this);
    }

    configure(features: MemoProfileFeatures): DefaultMemoProfile {
        return new DefaultMemoProfile({ ...this._features, ...features });
    }
}

export const MEMO_PROFILE = new DefaultMemoProfile();
