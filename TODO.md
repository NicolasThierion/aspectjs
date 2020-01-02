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

### Aspects
 - DuplicateAspectHandler

## Chore
- remove lodash dependency
- replace Jasmine with Jest

## Refactor
- remove {priority: number} in favor of { appliesBefore: Decorators[], appliesAfter: Decorators[] }
- use AnnotationRef = {module, name} in bundles & contexts
- create 'AdvicePipeline' = Array<(ctxt) => advice(ctxt)>
- freeze instead of seal
