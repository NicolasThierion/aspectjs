# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.1.2](https://github.com/NicolasThierion/aspectjs/compare/v0.1.1...v0.1.2) (2020-11-27)


### Bug Fixes

* **core:** fixed (again) dist folders missing from artifact ([654adad](https://github.com/NicolasThierion/aspectjs/commit/654adadfa35f17509c5108476273cebe5df8f3f4))





## [0.1.1](https://github.com/NicolasThierion/aspectjs/compare/v0.1.0...v0.1.1) (2020-11-27)


### Bug Fixes

* fixed core/* packages not being bundled within the artifact ([6adf98c](https://github.com/NicolasThierion/aspectjs/commit/6adf98c37454ddc45b3b484060aa8db88c18b50e))





# 0.1.0 (2020-11-27)


### Bug Fixes

* fixed doc not building ([2e64b3b](https://github.com/NicolasThierion/aspectjs/commit/2e64b3bb8b6e3d94c7d0e923cfe840aadf8adf74))
* **aspect:** advice functions are now bound to their respective aspects ([022e156](https://github.com/NicolasThierion/aspectjs/commit/022e156a150839c776f14b2dacd2730b68d36731))
* **aspect:** fixed @After property:set ([9f0cfa3](https://github.com/NicolasThierion/aspectjs/commit/9f0cfa3d72a711eb369b1f642d7ea4445ea28d0e))
* **aspect:** fixed @Around advices called in reverse order ([bb8d67b](https://github.com/NicolasThierion/aspectjs/commit/bb8d67b2bc72228f3bf9ba0dc5d017f6a12ea5b9))
* **core:** class & method advices now keep original symbol's toString() ([5f0d029](https://github.com/NicolasThierion/aspectjs/commit/5f0d029c82e9f21c8578e2e8bf718bd4b1654586))
* **core:** class annotations copy static properties, and thus work with Angular's \@Components ([8f72d11](https://github.com/NicolasThierion/aspectjs/commit/8f72d114d58913c571be4e3c592eba6b5a9ebe38))
* **core:** do not keep reference to runner in decorator factories ([d8e03f3](https://github.com/NicolasThierion/aspectjs/commit/d8e03f38f99785ad8044b05e35cbdff6387df5b5))
* **core:** fixed advice parameters not working aside @Compile ([8c60e86](https://github.com/NicolasThierion/aspectjs/commit/8c60e862e92422c61424682dad7b0b51d5b08e9a))
* **core:** fixed child advice being called along with its parent advice ([bc058f8](https://github.com/NicolasThierion/aspectjs/commit/bc058f8f29716932ce8ef239219d075151a38111))
* **core:** fixed infinite recursion when multiple @Compile on same class ([5e451cc](https://github.com/NicolasThierion/aspectjs/commit/5e451cc2af340a94a5d3e1358bd1bf9e71db85e5))
* **core:** fixed parameter advices entraving method advices ([e05bc45](https://github.com/NicolasThierion/aspectjs/commit/e05bc45a61d960b05e6a05059b9018184236b509))
* **memo:** dedupe memoized observables ([1450ebd](https://github.com/NicolasThierion/aspectjs/commit/1450ebd3f3c8873e02955cca70fb516f0a142863))
* @Memo works with observables ([f2d9b86](https://github.com/NicolasThierion/aspectjs/commit/f2d9b86e22b64442909e8e308ef1d1754126377e))


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
* **cacheable:** @Memo & @Cacheable support versionning cached objects ([73e8608](https://github.com/NicolasThierion/aspectjs/commit/73e8608c06e7836fbc4c02f296ac309b9cf4690d))
* **core:** @Aspect now supports inheritance ([3a4f7b4](https://github.com/NicolasThierion/aspectjs/commit/3a4f7b41790aee291f361c929506fbb22e3b9d1f))
* **core:** added support for @Order() ([7a0b90f](https://github.com/NicolasThierion/aspectjs/commit/7a0b90f4b3074690923e43ad7b61cb26dd0a1df4))
* **core:** ctxt.advices support for @Around advices ([7eebaaf](https://github.com/NicolasThierion/aspectjs/commit/7eebaaf356d6ee323e7fb81be60c6a9538f482a0))
* **core:** ctxt.advices supported for @Before ([5ff5d3e](https://github.com/NicolasThierion/aspectjs/commit/5ff5d3e1caec08fe6d2ffbc9dc12db7b5b1d8bb0))
* **core:** ctxt.advices works for @Compile on classes ([6e4776b](https://github.com/NicolasThierion/aspectjs/commit/6e4776b20b60b9f8cc5163e38bc639262f892c8a))
* **core:** prohibit enabling aspects once annotations has been compiled ([2583e02](https://github.com/NicolasThierion/aspectjs/commit/2583e02fe31e8aca38d7a97a01c559aeb85d6c38))
* **core:** support for ctxt.advices for @After advices ([ba17916](https://github.com/NicolasThierion/aspectjs/commit/ba179160d63ca13199eba8a63c6eb1640b7cb2d8))
* **core:** support for ctxt.advices for @AfterReturn advices ([4897c1b](https://github.com/NicolasThierion/aspectjs/commit/4897c1b32da79265b2efbdd5de73e2c5f7009bb8))
* **factory:** @Compile class advices can replace constructors ([088adcc](https://github.com/NicolasThierion/aspectjs/commit/088adcc2eb2b0f2a58ffc1a8f0517606cd5e8e3b))
* **factory:** added support for 'class.afterReturn' ([4aebe60](https://github.com/NicolasThierion/aspectjs/commit/4aebe60080da4219aa13e670119c5b7b665eb404))
* **factory:** added support for nested 'class.around' aspects ([7e79725](https://github.com/NicolasThierion/aspectjs/commit/7e7972582042db5b8252c46e7d475353f5c6f616))
* **memo:** ability to auto select the proper memo driver ([4f79716](https://github.com/NicolasThierion/aspectjs/commit/4f797169927602200ed6eab9b4d17b2d99ee45fb))
* **memo:** add support for @Memo method returning observables ([7ba9be4](https://github.com/NicolasThierion/aspectjs/commit/7ba9be4384c181d8407f9bdb3fb93fd2c85c7f3f))
* **memo:** compatibility with Promises ([d107c3b](https://github.com/NicolasThierion/aspectjs/commit/d107c3b76c889f0fb6852043c534c080f5574e93))
* **memo:** invalidates cache if \@Memo method changed or \@Cacheable constructor changes ([051b1f8](https://github.com/NicolasThierion/aspectjs/commit/051b1f8a32b49c7b4969a9065e9806638db6ac5b))
* added '@Compile' advices ([a316479](https://github.com/NicolasThierion/aspectjs/commit/a31647985df869862bb95be0df8a4b17d66624f3))
* create multiple bundles (esm2015, fesm2015, umd, unpkg) ([be93c10](https://github.com/NicolasThierion/aspectjs/commit/be93c10db96f4062d7e774e6caeebe33dac6044c))
* **factory:** initial support for 'class.around' aspects ([43f65c2](https://github.com/NicolasThierion/aspectjs/commit/43f65c2af2824dfe8e13efda719172b0ec5e9988))
* **factory:** initial support for class.afterThrow aspects ([e108483](https://github.com/NicolasThierion/aspectjs/commit/e10848354075976283e6cdc2755aaf7db251dca3))
* **memo:** added support for @Memo.hashcode option ([cf23217](https://github.com/NicolasThierion/aspectjs/commit/cf232178b7662d528b2f474373ba5ccc1e84b65b))
* **memo:** added support for promises in arrays ([b792b27](https://github.com/NicolasThierion/aspectjs/commit/b792b27ee4ba44a8a1e78ee3709bf23c8fcbe317))
* **memo:** fully functionnal synchronous @Memo with Localstorage ([b595daf](https://github.com/NicolasThierion/aspectjs/commit/b595daf519392e9754f4401344bb741efc3d037f))
* **memo:** IDBDriver works with Promises ([a639cc7](https://github.com/NicolasThierion/aspectjs/commit/a639cc7b8cc0495d7b2f871df0ffb75acb8c5eb4))
* **memo:** initial support for localStoraage based memo ([75ed4bc](https://github.com/NicolasThierion/aspectjs/commit/75ed4bc01996c426143c24e4d215a5a5d0ac5d03))
* **memo:** initial support for localstorage memo ([58f50a4](https://github.com/NicolasThierion/aspectjs/commit/58f50a4b5234528c3d15bf1834d8b664a7ee75f0))
* added memo aspect ([93319d3](https://github.com/NicolasThierion/aspectjs/commit/93319d364adfcd6e676ee5cb129c001731f83dd5))


### Reverts

* Revert "chore: replaced jasmine with jest" ([d6b5ffe](https://github.com/NicolasThierion/aspectjs/commit/d6b5ffe89c719a8697bf6d8e4562d86f82b874fe))





# 1.0.0 (2020-02-12)


### Bug Fixes

* **aspect:** advice functions are now bound to their respective aspects ([022e156](https://github.com/NicolasThierion/aspectjs/commit/022e156a150839c776f14b2dacd2730b68d36731))
* **aspect:** fixed @After property:set ([9f0cfa3](https://github.com/NicolasThierion/aspectjs/commit/9f0cfa3d72a711eb369b1f642d7ea4445ea28d0e))
* **aspect:** fixed @Around advices called in reverse order ([bb8d67b](https://github.com/NicolasThierion/aspectjs/commit/bb8d67b2bc72228f3bf9ba0dc5d017f6a12ea5b9))


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


### Reverts

* Revert "chore: replaced jasmine with jest" ([d6b5ffe](https://github.com/NicolasThierion/aspectjs/commit/d6b5ffe89c719a8697bf6d8e4562d86f82b874fe))
