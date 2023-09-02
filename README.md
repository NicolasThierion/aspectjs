# AspectJS

<p align="center"><a href="https://github.com/NicolasThierion/aspectjs"><img src="https://aspectjs.gitlab.io/logo.png" alt="AspectJS logo" height="140"/></a></p>
<h1 align="center">@aspectjs</h1>

<h3 align="center">The AOP framework for Javascript, Typescript, Browser & Node.</p>

<p align="center">

[![ci-status]](https://gitlab.com/aspectjs/aspectjs)
[![coverage report]](https://gitlab.com/aspectjs/aspectjs/-/commits/main)
[![npm version]](https://www.npmjs.com/package/@aspectjs/core)
[![license]](https://www.npmjs.com/package/@aspectjs/core)
[![NPM Downloads]](https://www.npmjs.com/package/@aspectjs/core)
[![bundlejs]](https://bundlejs.com/?q=%40aspectjs%2Fcommon%2C%40aspectjs%2Fcore&treeshake=[*]%2C[*])
<!--[![Latest Release]](https://gitlab.com/aspectjs/aspectjs/-/releases)-->

</p><br/><br/>

## 📜 Abstract

Inspired by the [AspectJ](https://www.eclipse.org/aspectj/) java framework,
**AspectJS** leverages **[ES Decorators](https://github.com/tc39/proposal-decorators)** to bring
Aspect Oriented Programming to Javascript and Typescript.

![demo-gif]


## ⚙️ Usage:

- Install the package
  ```bash
  npm i @aspectjs/core @aspectjs/common
  ```
- Create an annotation:

  ```ts
  import { AnnotationFactory, AnnotationType } from '@aspectjs/common';

  const ANNOTATION_FACTORY = new AnnotationFactory('demo');
  const Toasted = ANNOTATION_FACTORY.create(
    AnnotationType.METHOD,
    function Toasted() {},
  );
  ```

- Use that annotation on a class, a method, a property or a parameter
  ```ts
  class Main {
    @Toasted()
    run() {
      console.log('run');
    }
  }
  ```
- Declare an aspect triggered by the annotation:
  ```ts
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
  import { getWeaver } from '@aspectjs/core';

  getWeaver().enable(new ToastedAspect());
  ```

## 🚀 Why?

AOP is a core concept of popular frameworks such as [Angular](https://angular.io/), [Nest.js](https://nestjs.com/) or [TypeORM](https://github.com/typeorm/typeorm). All these frameworks use [ECMAScript Decorators](https://github.com/tc39/proposal-decorators) to add behavior to classes and methods with a simple `@` sign, and it works fairly well; However, a decorator ships with the additional behavior built-in, making it hard to extend and impossible to seamlessly integrate with other third party libs.

![without-aspectjs]

_AspectJS_ introduces the concept of annotations for Javascript. Simply put, an _AspectJS annotation_ is an _ECMAScript decorator_ with no implementation. The actual behavior is added later through the introduction of _Aspects_.

![with-aspectjs]

## 🔗 Documentation

For more advanced usage, please read the documentation: [https://aspectjs.gitlab.io/](https://aspectjs.gitlab.io/).

MIT Licensed

[coverage report]: https://gitlab.com/aspectjs/aspectjs/badges/main/coverage.svg?job=coverage
[ci-status]: https://gitlab.com/aspectjs/aspectjs/badges/main/pipeline.svg
[Latest Release]: https://gitlab.com/aspectjs/aspectjs/-/badges/release.svg
[npm version]: https://img.shields.io/npm/v/@aspectjs/core.svg
[license]: https://img.shields.io/npm/l/@aspectjs/core.svg
[NPM Downloads]: https://img.shields.io/npm/dm/@aspectjs/common.svg
[demo-gif]: https://raw.githubusercontent.com/NicolasThierion/aspectjs/HEAD/.assets/demo.gif
[with-aspectjs]: https://raw.githubusercontent.com/NicolasThierion/aspectjs/HEAD/.assets/with-aspectjs.png
[without-aspectjs]: https://raw.githubusercontent.com/NicolasThierion/aspectjs/HEAD/.assets/without-aspectjs.png
[bundlejs]: https://deno.bundlejs.com/badge?q=@aspectjs/common,@aspectjs/core&treeshake=[*],[*]