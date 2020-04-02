import { setWeaver } from './weaver/weaver';
import { LoadTimeWeaver } from './weaver/load-time/load-time-weaver';

setWeaver(new LoadTimeWeaver());
