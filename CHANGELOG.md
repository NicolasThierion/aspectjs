# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.5.1](https://github.com/NicolasThierion/aspectjs/compare/v0.5.0...v0.5.1) (2024-09-23)

## [0.5.0](https://github.com/NicolasThierion/aspectjs/compare/v0.4.4...v0.5.0) (2024-09-23)


### ⚠ BREAKING CHANGES

* **common:** AnnotationFactory.create now take a mandatory annotation name when giving annotationStub

* **common:** AnnotationFactory.create now take a mandatory annotation name when giving annotationStub ([0bf1e7f](https://github.com/NicolasThierion/aspectjs/commit/0bf1e7f0b3c7599823b66eb5a4e74dde69ce7e71))

## [0.4.4](https://github.com/NicolasThierion/aspectjs/compare/v0.4.3...v0.4.4) (2024-09-18)

## [0.4.3](https://github.com/NicolasThierion/aspectjs/compare/v0.4.2...v0.4.3) (2024-09-17)

## [0.4.2](https://github.com/NicolasThierion/aspectjs/compare/v0.4.1...v0.4.2) (2024-09-17)

## [0.4.1](https://github.com/NicolasThierion/aspectjs/compare/v0.4.0...v0.4.1) (2024-09-17)

## [0.4.0](https://github.com/NicolasThierion/aspectjs/compare/v0.3.17...v0.4.0) (2024-09-16)


### ⚠ BREAKING CHANGES

* renamed AdviceType, AnotationType & PointcutType to AdviceKind, AnotationKind & PointcutKind

* renamed AdviceType, AnotationType & PointcutType to AdviceKind, AnotationKind & PointcutKind ([4f377e8](https://github.com/NicolasThierion/aspectjs/commit/4f377e84d73f7346fb81bb866ff60d7bb3f99b13))


### Features

* **common:** added 'abstract\(\)' helper to allow empty methods to return a value ([5a83f97](https://github.com/NicolasThierion/aspectjs/commit/5a83f97b5c3a499cf510426135d0b87879d7d2d2))
* **common:** allow abstract() template to take constructory as template type) ([4c41a5e](https://github.com/NicolasThierion/aspectjs/commit/4c41a5e43a737540067d137daad4f52a80f110f3))
* **core:** added bridge to connect annotations to existing decorators ([5d635e5](https://github.com/NicolasThierion/aspectjs/commit/5d635e5fa532a3aa45dee247d62e9df35bc36b96))
* **core:** annotation mixin now supports calling compile advices of newly added annotations ([a9c26a1](https://github.com/NicolasThierion/aspectjs/commit/a9c26a1ad58a944ba441da97081dfa987ab13c41))
* **core:** enable an aspect override existing aspect with same id ([769bf23](https://github.com/NicolasThierion/aspectjs/commit/769bf23aa7b4fa4211e302e1dd7ad5ebd597a853))
* **http:** support for \@Body() annotation ([e2721e4](https://github.com/NicolasThierion/aspectjs/commit/e2721e4661483ac6961bea121794766d214d96af))
* **httyped:** added support for \@Body() annotation ([21d2c9b](https://github.com/NicolasThierion/aspectjs/commit/21d2c9be0518a24db239d4822fbd2c83cd4ef89d))


### Bug Fixes

* **core:** allow early definition of classes with annotations ([5d31063](https://github.com/NicolasThierion/aspectjs/commit/5d310637a56f47eb5a84f85505510365b7a119f6))
* **core:** class weaving now copy all metadata of decorated methods / properties ([f7e6d03](https://github.com/NicolasThierion/aspectjs/commit/f7e6d038678b578e9845dac42e1c977bd2710d56))
* **core:** fixed annotation mixin not working with abstract return values when a method has annotation on parameters & method ([8ea64af](https://github.com/NicolasThierion/aspectjs/commit/8ea64afef3d2437e8c8165069272e88b1a9ae59e))
* **core:** parameter pointcut being mixed with its methodpointcut counterpart ([e4d7c01](https://github.com/NicolasThierion/aspectjs/commit/e4d7c01a3842e504869a00e0e3260b487d2483bb))
* **httyped:** requestParams() used to require an argument ([d6e22ec](https://github.com/NicolasThierion/aspectjs/commit/d6e22ec1c2db85ec5d71063daa17792e3d427d08))
* property descriptor being linked twice in case of decorators on both method & parameters ([98367f6](https://github.com/NicolasThierion/aspectjs/commit/98367f6d7eb53d6b264772a43c30e87f9db3bca3))

## [0.3.17](https://github.com/NicolasThierion/aspectjs/compare/v0.3.16...v0.3.17) (2023-11-22)

### Bug Fixes

- typedoc generation ([064a7f7](https://github.com/NicolasThierion/aspectjs/commit/064a7f7ddfa2f137588681b70a98e6b1c7899a7e))

## [0.3.16](https://github.com/NicolasThierion/aspectjs/compare/v0.3.15...v0.3.16) (2023-11-21)

### Bug Fixes

- doc generation ([e0f69cf](https://github.com/NicolasThierion/aspectjs/commit/e0f69cfd7fb4334af688574ab59ff972930aebc1))

## [0.3.15](https://github.com/NicolasThierion/aspectjs/compare/v0.3.14...v0.3.15) (2023-10-24)

## [0.3.14](https://github.com/NicolasThierion/aspectjs/compare/v0.3.13...v0.3.14) (2023-10-24)

### Bug Fixes

- annotations & aspects works with static methods / properties ([53c0ede](https://github.com/NicolasThierion/aspectjs/commit/53c0ede2ceb0a72b0c76aae4cb5aef2dfde226e0))

## [0.3.13](https://github.com/NicolasThierion/aspectjs/compare/v0.3.12...v0.3.13) (2023-10-16)

### Features

- **persistence:** created Transactional aspect that works with Typeorm ([0413471](https://github.com/NicolasThierion/aspectjs/commit/04134718f487f72ec4b4fc3ab3c727a361f8bac5))

## [0.3.12](https://github.com/NicolasThierion/aspectjs/compare/v0.3.11...v0.3.12) (2023-09-14)

### Features

- **core:** added support for `@ Compile` advices ([e279a39](https://github.com/NicolasThierion/aspectjs/commit/e279a39b65b34e6742c521451666e8dabb818fa5))

## [0.3.11](https://github.com/NicolasThierion/aspectjs/compare/v0.3.10...v0.3.11) (2023-07-29)

## [0.3.10](https://github.com/NicolasThierion/aspectjs/compare/v0.3.9...v0.3.10) (2023-07-29)

## [0.3.9](https://github.com/NicolasThierion/aspectjs/compare/v0.3.8...v0.3.9) (2023-07-28)

### Features

- **common:** AnnotationContextRegistry can now return BoundAnnotationContexts ([7eae6d4](https://github.com/NicolasThierion/aspectjs/commit/7eae6d482237772adf48b59c3bddc7b3371de95d))

### Bug Fixes

- BoundAnnotationContext type is aware of used annotationStub ([bc6317f](https://github.com/NicolasThierion/aspectjs/commit/bc6317fde1ed4de2a472660ff876e3d3936aa1b0))

## [0.3.8](https://github.com/NicolasThierion/aspectjs/compare/v0.3.7...v0.3.8) (2023-07-27)

### Features

- ability to set several join point per pointcut ([a9ed9a7](https://github.com/NicolasThierion/aspectjs/commit/a9ed9a7df242ba77ba05d60e89e2e03c6d2051fc))
- **core:** target in AdviceContext has now a value. ([b3bd349](https://github.com/NicolasThierion/aspectjs/commit/b3bd349d4bfde7166f8c0310a185f72aa84c8709))

### Bug Fixes

- **core:** fix parameter aspects not being applied when a method has method decorators ([3dee5b7](https://github.com/NicolasThierion/aspectjs/commit/3dee5b7ec0e6de8a59311e8d95c94a4927294ae1))

## [0.3.8](https://github.com/NicolasThierion/aspectjs/compare/v0.3.7...v0.3.8) (2023-07-16)

### Features

- ability to set several join point per pointcut ([c4bd963](https://github.com/NicolasThierion/aspectjs/commit/c4bd963cd0158bdcbc6ddcb235f7d1cde68635b0))

## [0.3.7](https://github.com/NicolasThierion/aspectjs/compare/v0.3.5...v0.3.7) (2023-07-16)

### Bug Fixes

- umd builds ([a496c57](https://github.com/NicolasThierion/aspectjs/commit/a496c57545423144c094df05e6555b30a3893d26))

## [0.3.6](https://github.com/NicolasThierion/aspectjs/compare/v0.3.5...v0.3.6) (2023-07-16)

### Bug Fixes

- umd builds ([a496c57](https://github.com/NicolasThierion/aspectjs/commit/a496c57545423144c094df05e6555b30a3893d26))

## [0.3.5](https://github.com/NicolasThierion/aspectjs/compare/v0.3.4...v0.3.5) (2023-07-15)

## [0.3.4](https://github.com/NicolasThierion/aspectjs/compare/v0.3.3...v0.3.4) (2023-07-15)

## [0.3.3](https://github.com/NicolasThierion/aspectjs/compare/v0.3.2...v0.3.3) (2023-07-15)

## [0.3.4](https://github.com/NicolasThierion/aspectjs/compare/v0.3.2...v0.3.4) (2023-07-15)

## [0.3.3](https://github.com/NicolasThierion/aspectjs/compare/v0.3.2...v0.3.3) (2023-07-15)

## [0.3.3](https://github.com/NicolasThierion/aspectjs/compare/v0.3.2...v0.3.3) (2023-07-15)

## [0.3.3](https://github.com/NicolasThierion/aspectjs/compare/v0.3.2...v0.3.3) (2023-07-15)
