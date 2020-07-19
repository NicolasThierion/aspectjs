import { setWeaver } from './weaver/weaver';
import { JitWeaver } from './weaver/jit/jit-weaver';

setWeaver(new JitWeaver());
