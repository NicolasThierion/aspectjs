## Ideas
- use webworkers & cache
- use uuid, weekref, murmurhash, hlc clock, sorted arrays
- prohibits body in annotationStub 

## Features
### Annotations
- `@Automapper`
- `@Cacheable(key? | {key?, ttl?})`
- `@EqualsAndHashcode({of?})`
- `@Memo(key? | {key?, ttl?})`
- `@Typesafe`
- `@Clone`
- `@Sealed`
- `@Throttle`
- `@Debounce`
- `@Bind`
- `@Cloneable`

### Pointcuts: 
 - beforeProperty
 - aroundProperty
 - afterThrowProperty
 - afterProperty
 - compilePropertySetter
 - beforePropertySetter
 - aroundPropertySetter
 - afterReturnPropertySetter
 - afterThrowPropertySetter
 - afterPropertySetter
 - compileMethod
 - beforeMethod
 - aroundMethod
 - afterReturnMethod
 - afterThrowMethod
 - afterMethod
 - compileParameter
 - beforeParameter
 - aroundParameter
 - afterReturnParameter
 - afterThrowParameter
 - afterParameter

### Aspects
 - DuplicateAspectHandler
 - advice static methods?

## Chore
- remove lodash dependency

## Refactor
- remove {priority: number} in favor of { appliesBefore: Decorators[], appliesAfter: Decorators[] }
- use AnnotationRef = {module, name} in bundles & contexts
- move ctxt.annotation.target into ctxt.target
- add priority on advices
- move target out of ctxt.annotation
