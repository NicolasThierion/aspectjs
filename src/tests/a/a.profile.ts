import { AAspect } from './a.aspect';
import { getWeaver } from '../../index';
import { WeaverProfile } from '../../weaver/profile';

export const aProfile = new WeaverProfile().enable(new AAspect());
