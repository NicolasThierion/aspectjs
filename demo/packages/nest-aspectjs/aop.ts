import { getWeaver } from '@aspectjs/core';
import { NestClientAspect } from 'nestjs-httyped-client';

getWeaver().enable(new NestClientAspect());
