import { WeaverProfile } from '../../../weaver/profile';
import { AAspect } from './a.aspect';

export const AProfile = new WeaverProfile().enable(new AAspect());
