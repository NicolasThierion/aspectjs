## Ideas
- use webworkers & cache
- prohibits body in annotationStub 

## Features
### Annotations
- `@Fetch`
- `@Automapper`
- `@Cacheable(key? | {key?, ttl?})`
- `@EqualsAndHashcode({of?})`
- `@Typesafe`
- `@Clone`
- `@Sealed`
- `@Throttle`
- `@Debounce`
- `@Bind`
- `@Cloneable`

### Aspects
 - DuplicateAspectHandler
 - advise static methods?
 - add `ObservableMemoMarshaller`
 
## Refactor
- use AnnotationRef = {module, name} in bundles & contexts
- add priority on advices
- do not nest decorators when multiple annotations on the same symbol
- test `on.X.annotations(\<empty\>)` should return all advices


## Chore
- test lerna publish & lerna version
