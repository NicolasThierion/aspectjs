import { Annotation, AnnotationFactory } from '@aspectjs/common';
import { Aspect, getWeaver } from '@aspectjs/core';
import 'reflect-metadata';
import 'whatwg-fetch';
import { HttypedClientFactory } from '../src/client-factory/client.factory';
import { UsersApi } from './users.api';

const Get: MethodDecorator = (target, propertyKey, descriptor) => {};
const GetAnnotation = new AnnotationFactory('test').create(function Get() {});

@Aspect('test')
class DecoratorBridgeAspect {
  constructor() {}

  bridge(annotation: Annotation, decorator: MethodDecorator) {}
}
getWeaver().enable(new DecoratorBridgeAspect());
getWeaver().enable(new DecoratorBridgeAspect());

new DecoratorBridgeAspect().bridge(GetAnnotation, Get);

async function main() {
  const usersApi = new HttypedClientFactory({
    baseUrl: 'https://jsonplaceholder.typicode.com',
  })
    .addRequestHandler((r) => console.log(`[${r.method}] ${r.url}`))
    .create(UsersApi);

  const user = await usersApi.getOne(2);
  console.log(user.address.print());
}

main();
