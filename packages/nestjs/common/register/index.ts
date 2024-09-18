import { getWeaver } from '@aspectjs/core';
import { NestCommonAspect } from './src/nestjs-common.aspect';

getWeaver().enable(new NestCommonAspect());
