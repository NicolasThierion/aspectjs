## Ideas
- use webworkers & cache

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
 
## Refactor
- Do not nest decorators when multiple annotations on the same symbol
- test `on.X.withAnnotations(\<empty\>)` should return all advices
- replace objects by Maps. Get rid of `target.ref` + `annotation.ref` ?

## Chore
- test lerna publish & lerna version

## Memo
- fix `@Compile(on.class.withAnnotations(Cacheable)) registerCacheKey` not working 
- create `MemoryDriver` that has higher priority for short expiration times

## Fix
- fix `@Before` method not working when coupled with `@Before` parameter  

### tests
 - test multiple `@Before` on the same apsect method
  
