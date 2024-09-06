import { AnnotationFactory } from '@aspectjs/common';
import { AnnotationMixinAspect, getWeaver } from '@aspectjs/core';
import 'reflect-metadata';
import 'whatwg-fetch';

const Get: (...args: any[]) => MethodDecorator = (...args: any[]) => {
  console.log(`Get(${args.join(', ')})`);

  return (target, propertyKey: any, descriptor) => {
    console.log(`Get ${target.constructor.name}.${propertyKey}`);
    return descriptor;
  };
};

const GetAnnotation = new AnnotationFactory('test').create(function Get(
  ...args: any[]
) {});

getWeaver().enable(new AnnotationMixinAspect().bridge(GetAnnotation, Get));

class X {
  @GetAnnotation('annotationArg1')
  m(args: any[]): void {
    debugger;
    console.log('m', args);
  }
}

new X().m(['arg1', 'arg2']);
// async function main() {
//   const usersApi = new HttypedClientFactory({
//     baseUrl: 'https://jsonplaceholder.typicode.com',
//   })
//     .addRequestHandler((r) => console.log(`[${r.method}] ${r.url}`))
//     .create(UsersApi);

//   const user = await usersApi.getOne(2);
//   console.log(user.address.print());
// }

// main();
