remove rollup-copy-plugin & rollup-plugin-cleaner

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
- fork murmurhash3js
- add LICENSE.md
- use AnnotationRef = {module, name} in bundles & contexts
- add @Order on advices
- do not nest decorators when multiple annotations on the same symbol
- test `on.X.annotations(\<empty\>)` should return all advices


## Chore
- test lerna publish & lerna version


### tests
 - test @Memo with HttpClient observables
 -  test Weaver.getAspect(AspectClass)
  
