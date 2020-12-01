# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.1.3](https://github.com/NicolasThierion/aspectjs/compare/v0.1.2...v0.1.3) (2020-12-01)

**Note:** Version bump only for package @aspectjs/memo





## [0.1.2](https://github.com/NicolasThierion/aspectjs/compare/v0.1.1...v0.1.2) (2020-11-27)


### Bug Fixes

* **core:** fixed (again) dist folders missing from artifact ([654adad](https://github.com/NicolasThierion/aspectjs/commit/654adadfa35f17509c5108476273cebe5df8f3f4))





## [0.1.1](https://github.com/NicolasThierion/aspectjs/compare/v0.1.0...v0.1.1) (2020-11-27)


### Bug Fixes

* fixed core/* packages not being bundled within the artifact ([6adf98c](https://github.com/NicolasThierion/aspectjs/commit/6adf98c37454ddc45b3b484060aa8db88c18b50e))





# 0.1.0 (2020-11-27)


### Bug Fixes

* **core:** class & method advices now keep original symbol's toString() ([5f0d029](https://github.com/NicolasThierion/aspectjs/commit/5f0d029c82e9f21c8578e2e8bf718bd4b1654586))
* **core:** class annotations copy static properties, and thus work with Angular's \@Components ([8f72d11](https://github.com/NicolasThierion/aspectjs/commit/8f72d114d58913c571be4e3c592eba6b5a9ebe38))
* **core:** fixed child advice being called along with its parent advice ([bc058f8](https://github.com/NicolasThierion/aspectjs/commit/bc058f8f29716932ce8ef239219d075151a38111))
* **core:** fixed infinite recursion when multiple @Compile on same class ([5e451cc](https://github.com/NicolasThierion/aspectjs/commit/5e451cc2af340a94a5d3e1358bd1bf9e71db85e5))
* **core:** fixed parameter advices entraving method advices ([e05bc45](https://github.com/NicolasThierion/aspectjs/commit/e05bc45a61d960b05e6a05059b9018184236b509))
* **memo:** dedupe memoized observables ([1450ebd](https://github.com/NicolasThierion/aspectjs/commit/1450ebd3f3c8873e02955cca70fb516f0a142863))
* @Memo works with observables ([f2d9b86](https://github.com/NicolasThierion/aspectjs/commit/f2d9b86e22b64442909e8e308ef1d1754126377e))


### Features

* **cacheable:** @Memo & @Cacheable support versionning cached objects ([73e8608](https://github.com/NicolasThierion/aspectjs/commit/73e8608c06e7836fbc4c02f296ac309b9cf4690d))
* **core:** prohibit enabling aspects once annotations has been compiled ([2583e02](https://github.com/NicolasThierion/aspectjs/commit/2583e02fe31e8aca38d7a97a01c559aeb85d6c38))
* **memo:** ability to auto select the proper memo driver ([4f79716](https://github.com/NicolasThierion/aspectjs/commit/4f797169927602200ed6eab9b4d17b2d99ee45fb))
* **memo:** add support for @Memo method returning observables ([7ba9be4](https://github.com/NicolasThierion/aspectjs/commit/7ba9be4384c181d8407f9bdb3fb93fd2c85c7f3f))
* **memo:** added support for @Memo.hashcode option ([cf23217](https://github.com/NicolasThierion/aspectjs/commit/cf232178b7662d528b2f474373ba5ccc1e84b65b))
* **memo:** added support for promises in arrays ([b792b27](https://github.com/NicolasThierion/aspectjs/commit/b792b27ee4ba44a8a1e78ee3709bf23c8fcbe317))
* **memo:** compatibility with Promises ([d107c3b](https://github.com/NicolasThierion/aspectjs/commit/d107c3b76c889f0fb6852043c534c080f5574e93))
* **memo:** fully functionnal synchronous @Memo with Localstorage ([b595daf](https://github.com/NicolasThierion/aspectjs/commit/b595daf519392e9754f4401344bb741efc3d037f))
* **memo:** IDBDriver works with Promises ([a639cc7](https://github.com/NicolasThierion/aspectjs/commit/a639cc7b8cc0495d7b2f871df0ffb75acb8c5eb4))
* **memo:** initial support for localStoraage based memo ([75ed4bc](https://github.com/NicolasThierion/aspectjs/commit/75ed4bc01996c426143c24e4d215a5a5d0ac5d03))
* **memo:** invalidates cache if \@Memo method changed or \@Cacheable constructor changes ([051b1f8](https://github.com/NicolasThierion/aspectjs/commit/051b1f8a32b49c7b4969a9065e9806638db6ac5b))
* create multiple bundles (esm2015, fesm2015, umd, unpkg) ([be93c10](https://github.com/NicolasThierion/aspectjs/commit/be93c10db96f4062d7e774e6caeebe33dac6044c))
* **memo:** initial support for localstorage memo ([58f50a4](https://github.com/NicolasThierion/aspectjs/commit/58f50a4b5234528c3d15bf1834d8b664a7ee75f0))
* added memo aspect ([93319d3](https://github.com/NicolasThierion/aspectjs/commit/93319d364adfcd6e676ee5cb129c001731f83dd5))





# 1.1.0 (2020-07-19)


### Bug Fixes

* **core:** fixed child advice being called along with its parent advice ([bc058f8](https://github.com/NicolasThierion/aspectjs/commit/bc058f8f29716932ce8ef239219d075151a38111))
* **core:** fixed infinite recursion when multiple @Compile on same class ([5e451cc](https://github.com/NicolasThierion/aspectjs/commit/5e451cc2af340a94a5d3e1358bd1bf9e71db85e5))


### Features

* **cacheable:** @Memo & @Cacheable support versionning cached objects ([73e8608](https://github.com/NicolasThierion/aspectjs/commit/73e8608c06e7836fbc4c02f296ac309b9cf4690d))
* **memo:** ability to auto select the proper memo driver ([4f79716](https://github.com/NicolasThierion/aspectjs/commit/4f797169927602200ed6eab9b4d17b2d99ee45fb))
* **memo:** added support for @Memo.hashcode option ([cf23217](https://github.com/NicolasThierion/aspectjs/commit/cf232178b7662d528b2f474373ba5ccc1e84b65b))
* **memo:** added support for promises in arrays ([b792b27](https://github.com/NicolasThierion/aspectjs/commit/b792b27ee4ba44a8a1e78ee3709bf23c8fcbe317))
* **memo:** compatibility with Promises ([d107c3b](https://github.com/NicolasThierion/aspectjs/commit/d107c3b76c889f0fb6852043c534c080f5574e93))
* **memo:** fully functionnal synchronous @Memo with Localstorage ([b595daf](https://github.com/NicolasThierion/aspectjs/commit/b595daf519392e9754f4401344bb741efc3d037f))
* **memo:** IDBDriver works with Promises ([a639cc7](https://github.com/NicolasThierion/aspectjs/commit/a639cc7b8cc0495d7b2f871df0ffb75acb8c5eb4))
* **memo:** initial support for localStoraage based memo ([75ed4bc](https://github.com/NicolasThierion/aspectjs/commit/75ed4bc01996c426143c24e4d215a5a5d0ac5d03))
* **memo:** initial support for localstorage memo ([58f50a4](https://github.com/NicolasThierion/aspectjs/commit/58f50a4b5234528c3d15bf1834d8b664a7ee75f0))
* added memo aspect ([93319d3](https://github.com/NicolasThierion/aspectjs/commit/93319d364adfcd6e676ee5cb129c001731f83dd5))
