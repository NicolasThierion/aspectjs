import { Annotation, AnnotationFactory } from '@aspectjs/common';
import { Aspect, BeforeContext, Compile, getWeaver, on } from '@aspectjs/core';
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

@Aspect('test')
class DecoratorBridgeAspect {
  private bridgeCounter = 0;
  constructor() {}

  bridge(
    annotation: Annotation,
    decorator: (...args: any[]) => MethodDecorator,
  ) {
    const proto = Object.getPrototypeOf(this);
    const bridgeAdviceName = `bridge_${annotation.ref}_${decorator.name}_${this
      .bridgeCounter++}`;

    const bridgeAdvice: PropertyDescriptor = {
      value: (ctxt: BeforeContext) => {
        console.log(`Invoking decorator ${decorator.name}`);

        return (decorator(ctxt.annotations(annotation).find()[0]!.args) as any)(
          ...ctxt.target.asDecoratorArgs(),
        );
      },
      writable: true,
      configurable: true,
    };

    Object.defineProperty(proto, bridgeAdviceName, bridgeAdvice);

    Compile(on.any.withAnnotations(annotation))(
      proto,
      bridgeAdviceName,
      bridgeAdvice,
    );

    return this;
  }
}

getWeaver().enable(new DecoratorBridgeAspect().bridge(GetAnnotation, Get));

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
