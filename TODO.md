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
 - compileParameter
 - beforeParameter
 - aroundParameter
 - afterReturnParameter
 - afterThrowParameter
 - afterParameter

### Aspects
 - DuplicateAspectHandler
 - advice static methods?

## Refactor
- remove {priority: number} in favor of { appliesBefore: Decorators[], appliesAfter: Decorators[] }
- use AnnotationRef = {module, name} in bundles & contexts
- add priority on advices
- do not nest decorators when multiple annotations on the same symbol
- test on.X.annotations(<empty>) returns all advices
