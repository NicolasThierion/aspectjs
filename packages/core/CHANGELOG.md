# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 0.1.0 (2020-11-27)


### Bug Fixes

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

* **core:** @Aspect now supports inheritance ([3a4f7b4](https://github.com/NicolasThierion/aspectjs/commit/3a4f7b41790aee291f361c929506fbb22e3b9d1f))
* **core:** added support for @Order() ([7a0b90f](https://github.com/NicolasThierion/aspectjs/commit/7a0b90f4b3074690923e43ad7b61cb26dd0a1df4))
* **core:** ctxt.advices support for @Around advices ([7eebaaf](https://github.com/NicolasThierion/aspectjs/commit/7eebaaf356d6ee323e7fb81be60c6a9538f482a0))
* **core:** ctxt.advices supported for @Before ([5ff5d3e](https://github.com/NicolasThierion/aspectjs/commit/5ff5d3e1caec08fe6d2ffbc9dc12db7b5b1d8bb0))
* **core:** ctxt.advices works for @Compile on classes ([6e4776b](https://github.com/NicolasThierion/aspectjs/commit/6e4776b20b60b9f8cc5163e38bc639262f892c8a))
* **core:** prohibit enabling aspects once annotations has been compiled ([2583e02](https://github.com/NicolasThierion/aspectjs/commit/2583e02fe31e8aca38d7a97a01c559aeb85d6c38))
* **core:** support for ctxt.advices for @AfterReturn advices ([4897c1b](https://github.com/NicolasThierion/aspectjs/commit/4897c1b32da79265b2efbdd5de73e2c5f7009bb8))
* **memo:** add support for @Memo method returning observables ([7ba9be4](https://github.com/NicolasThierion/aspectjs/commit/7ba9be4384c181d8407f9bdb3fb93fd2c85c7f3f))
* create multiple bundles (esm2015, fesm2015, umd, unpkg) ([be93c10](https://github.com/NicolasThierion/aspectjs/commit/be93c10db96f4062d7e774e6caeebe33dac6044c))
* **core:** support for ctxt.advices for @After advices ([ba17916](https://github.com/NicolasThierion/aspectjs/commit/ba179160d63ca13199eba8a63c6eb1640b7cb2d8))
* **memo:** added support for @Memo.hashcode option ([cf23217](https://github.com/NicolasThierion/aspectjs/commit/cf232178b7662d528b2f474373ba5ccc1e84b65b))
* **memo:** initial support for localstorage memo ([58f50a4](https://github.com/NicolasThierion/aspectjs/commit/58f50a4b5234528c3d15bf1834d8b664a7ee75f0))
* added memo aspect ([93319d3](https://github.com/NicolasThierion/aspectjs/commit/93319d364adfcd6e676ee5cb129c001731f83dd5))





# 1.1.0 (2020-07-19)


### Bug Fixes

* **core:** do not keep reference to runner in decorator factories ([d8e03f3](https://github.com/NicolasThierion/aspectjs/commit/d8e03f38f99785ad8044b05e35cbdff6387df5b5))
* **core:** fixed advice parameters not working aside @Compile ([8c60e86](https://github.com/NicolasThierion/aspectjs/commit/8c60e862e92422c61424682dad7b0b51d5b08e9a))
* **core:** fixed child advice being called along with its parent advice ([bc058f8](https://github.com/NicolasThierion/aspectjs/commit/bc058f8f29716932ce8ef239219d075151a38111))
* **core:** fixed infinite recursion when multiple @Compile on same class ([5e451cc](https://github.com/NicolasThierion/aspectjs/commit/5e451cc2af340a94a5d3e1358bd1bf9e71db85e5))


### Features

* **core:** @Aspect now supports inheritance ([3a4f7b4](https://github.com/NicolasThierion/aspectjs/commit/3a4f7b41790aee291f361c929506fbb22e3b9d1f))
* **core:** ctxt.advices support for @Around advices ([7eebaaf](https://github.com/NicolasThierion/aspectjs/commit/7eebaaf356d6ee323e7fb81be60c6a9538f482a0))
* **core:** ctxt.advices supported for @Before ([5ff5d3e](https://github.com/NicolasThierion/aspectjs/commit/5ff5d3e1caec08fe6d2ffbc9dc12db7b5b1d8bb0))
* **core:** ctxt.advices works for @Compile on classes ([6e4776b](https://github.com/NicolasThierion/aspectjs/commit/6e4776b20b60b9f8cc5163e38bc639262f892c8a))
* **core:** support for ctxt.advices for @After advices ([ba17916](https://github.com/NicolasThierion/aspectjs/commit/ba179160d63ca13199eba8a63c6eb1640b7cb2d8))
* **core:** support for ctxt.advices for @AfterReturn advices ([4897c1b](https://github.com/NicolasThierion/aspectjs/commit/4897c1b32da79265b2efbdd5de73e2c5f7009bb8))
* **memo:** added support for @Memo.hashcode option ([cf23217](https://github.com/NicolasThierion/aspectjs/commit/cf232178b7662d528b2f474373ba5ccc1e84b65b))
* **memo:** initial support for localstorage memo ([58f50a4](https://github.com/NicolasThierion/aspectjs/commit/58f50a4b5234528c3d15bf1834d8b664a7ee75f0))
* added memo aspect ([93319d3](https://github.com/NicolasThierion/aspectjs/commit/93319d364adfcd6e676ee5cb129c001731f83dd5))





# 1.0.0 (2020-02-12)

**Note:** Version bump only for package @aspectjs/core





## [1.0.1](https://github.com/NicolasThierion/aspectjs/compare/v1.0.0...v1.0.1) (2020-02-12)

**Note:** Version bump only for package @aspectjs/core





# 1.0.0 (2020-02-12)

**Note:** Version bump only for package @aspectjs/core
