import { getWeaver } from '@aspectjs/core';
import { ToastedAspect } from './aspects/toasted.aspect';
import { ValidatedAspect } from './aspects/validated.aspect';

getWeaver().enable(new ValidatedAspect(), new ToastedAspect());
