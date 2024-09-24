# AspectJS

<p align="center"><a href="https://github.com/NicolasThierion/aspectjs"><img src="https://aspectjs.gitlab.io/logo.png" alt="AspectJS logo" height="140"/></a></p>

<h3 align="center">An AOP framework for Typescript, compatible with Browsers & Node.</p>

<p align="center">

[![ci-status]](https://gitlab.com/aspectjs/aspectjs)
[![coverage report]](https://gitlab.com/aspectjs/aspectjs/-/commits/main)
[![npm version]](https://www.npmjs.com/package/@aspectjs/core)
[![license]](https://www.npmjs.com/package/@aspectjs/core)
[![NPM Downloads]](https://www.npmjs.com/package/@aspectjs/core)
[![bundlejs]](https://bundlejs.com/?q=%40aspectjs%2Fcommon%2C%40aspectjs%2Fcore&treeshake=[*]%2C[*])
[![Latest Release]](https://gitlab.com/aspectjs/aspectjs/-/releases)

</p><br/><br/>


## 📜 Abstract

Inspired by the [AspectJ](https://www.eclipse.org/aspectj/) java framework,
**AspectJS** leverages **[ES Decorators](https://github.com/tc39/proposal-decorators)** to bring
Aspect Oriented Programming to Javascript and Typescript.


## 🎉 Demo:

Demo on [stackedit](https://stackblitz.com/edit/aspectjs-demo-0-5-1?file=index.ts).

[ECMAScript Decorators](https://github.com/tc39/proposal-decorators) are fantastic: they allow developers to **hide boilerplate code** behind a simple `@` sign, keeping the code clean, easy to read, and easy to write. Widely used in popular projects such as [Angular](https://angular.io/), [Nest.js](https://nestjs.com/) or [TypeORM](https://github.com/typeorm/typeorm), decorators have one major drawback: they come with their own built-in behavior, making interoperability between tools difficult, and preventing them from being repurposed for other uses.

_AspectJS_ takes a different approach, by introducing two important concepts: **Annotations** and **Aspects**.

- An _Annotation_ is essentially an empty decorator that marks a target (_class_, _property_, _method_ or _parameter_) as a candidate for further enhancements.
- **Aspects** can be selectively enabled to introduce new behaviors into the annotated elements.

<ul style="display: flex; justify-content: space-around; flex-flow: row wrap; list-style-type: none">
<li style="min-width: 300px">
without aspects


```ts
const A = function( target: Function) {
   // behaviorA
}
const B = function( target: Function) {
   // behaviorB
}
 
@A() 
@B()
class MyClass {}
```

</li>
<li>
with aspects

```ts
const af = new AnnotationFactory('my.org')
const A = af.create('A');
const B = af.create('B');

@A()
@B()
class MyClass {}

@Aspect()
class AB_Aspect {
  // behavior A
  // behavior B
}

getWeaver().enable(new AB_Aspect())
```

</li>
</ul>


## 🚀 Getting started:

- Install the packages
  ```bash
  npm i @aspectjs/core @aspectjs/common
  ```
- Create an annotation:

  ```ts
  // toasted.annotation.ts
  import { AnnotationFactory, AnnotationKind } from '@aspectjs/common';

  const ANNOTATION_FACTORY = new AnnotationFactory('demo');
  const Toasted = ANNOTATION_FACTORY.create(
    AnnotationKind.METHOD,
    'Toasted', 
    function Toasted() {},
  );
  ```

- Use that annotation on a class, a property, a method or a parameter:
  ```ts
  // main.ts
  class Main {
    @Toasted()
    run() {
      console.log('run');
    }
  }
  ```
- Declare an aspect triggered by the annotation:
  ```ts
  // toasted.aspect.ts
  import { Around, AroundContext, Aspect, JoinPoint, on } from '@aspectjs/core';
  @Aspect()
  class ToastedAspect {
    @Around(on.methods.withAnnotations(Toasted))
    toast(ctxt: AroundContext, jp: JoinPoint, jpArgs: unknown[]) {
      const result = jp(...jpArgs);
      const text = `${ctxt.target.label} completed successfully`;
      showToast(text);
      return result;
    }
  }
  ```
- Enable the aspect

  ```ts
  // aop.ts
  import { getWeaver } from '@aspectjs/core';

  getWeaver().enable(new ToastedAspect());
  ```


## 🔗 Documentation

For more advanced usage, please read the documentation: [https://aspectjs.gitlab.io/](https://aspectjs.gitlab.io/).

MIT Licensed

[coverage report]: https://gitlab.com/aspectjs/aspectjs/badges/main/coverage.svg?job=coverage
[ci-status]: https://gitlab.com/aspectjs/aspectjs/badges/main/pipeline.svg
[Latest Release]: https://gitlab.com/aspectjs/aspectjs/-/badges/release.svg
[npm version]: https://img.shields.io/npm/v/@aspectjs/core.svg
[license]: https://img.shields.io/npm/l/@aspectjs/core.svg
[NPM Downloads]: https://img.shields.io/npm/dm/@aspectjs/common.svg

[bundlejs]: https://deno.bundlejs.com/badge?q=@aspectjs/common,@aspectjs/core&treeshake=[*],[*]
