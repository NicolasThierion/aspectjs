# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
