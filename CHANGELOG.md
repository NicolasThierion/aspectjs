# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 1.0.0 (2020-02-09)


### Features

* **aspect:** added support for aspect priority & advice priority ([a4746d6](https://github.com/NicolasThierion/aspectjs/commit/a4746d63960c29ff979fa02567e4ae8f8cbd2f6b))
* **aspect:** added support for property.afterThrow advices ([23cd558](https://github.com/NicolasThierion/aspectjs/commit/23cd558cda826178c754d276c4c975684e465e0c))
* **aspect:** initial support for @Around, @Compile, @AfterThrow &@Before methods ([fb937ff](https://github.com/NicolasThierion/aspectjs/commit/fb937ffa75c594146cb2690affb2cd8b6cbff6cd))
* **aspect:** support for @After & @AfterThrow on property setters ([72518e9](https://github.com/NicolasThierion/aspectjs/commit/72518e95ff0489dce2e1fb91b824b7eb44546908))
* **aspect:** support for @Compile(property) ([be23481](https://github.com/NicolasThierion/aspectjs/commit/be23481950442e35cc4dde4609c3bfb788684354))
* **aspect:** support for all method advices ([289429a](https://github.com/NicolasThierion/aspectjs/commit/289429aafb9aec48664ac463adfd85953b055ac3))
* **aspect:** support for property setter @Around, @Before & @AfterReturn advices ([0b323f8](https://github.com/NicolasThierion/aspectjs/commit/0b323f88870b93d8c88bce26b6e0a9cd6bf2cd8d))
* **aspect:** support for property.@Around advices ([2f621ee](https://github.com/NicolasThierion/aspectjs/commit/2f621eecd683365651e34467ea40fcfe9716fea8))
* **aspet:** initial support for @Around(property:set) ([a42471d](https://github.com/NicolasThierion/aspectjs/commit/a42471d867d65ecf524cb491abf3bb2869172b12))
* **factory:** @Compile class advices can replace constructors ([088adcc](https://github.com/NicolasThierion/aspectjs/commit/088adcc2eb2b0f2a58ffc1a8f0517606cd5e8e3b))
* added '@Compile' advices ([a316479](https://github.com/NicolasThierion/aspectjs/commit/a31647985df869862bb95be0df8a4b17d66624f3))
* **factory:** added support for 'class.afterReturn' ([4aebe60](https://github.com/NicolasThierion/aspectjs/commit/4aebe60080da4219aa13e670119c5b7b665eb404))
* **factory:** added support for nested 'class.around' aspects ([7e79725](https://github.com/NicolasThierion/aspectjs/commit/7e7972582042db5b8252c46e7d475353f5c6f616))
* **factory:** initial support for 'class.around' aspects ([43f65c2](https://github.com/NicolasThierion/aspectjs/commit/43f65c2af2824dfe8e13efda719172b0ec5e9988))
* **factory:** initial support for class.afterThrow aspects ([e108483](https://github.com/NicolasThierion/aspectjs/commit/e10848354075976283e6cdc2755aaf7db251dca3))


### Bug Fixes

* **aspect:** advice functions are now bound to their respective aspects ([022e156](https://github.com/NicolasThierion/aspectjs/commit/022e156a150839c776f14b2dacd2730b68d36731))
* **aspect:** fixed @After property:set ([9f0cfa3](https://github.com/NicolasThierion/aspectjs/commit/9f0cfa3d72a711eb369b1f642d7ea4445ea28d0e))
* **aspect:** fixed @Around advices called in reverse order ([bb8d67b](https://github.com/NicolasThierion/aspectjs/commit/bb8d67b2bc72228f3bf9ba0dc5d017f6a12ea5b9))
