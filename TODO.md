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


- remove lodash dependency
- use webworkers & cache
- use uuid, weekref, murmurhash, hlc clock, sorted arrays
- DevModePlugin & ProdModePlugin
- plugin-based decorators that prohibits body in decorator function 


remove {priority: number} in favor of { appliesBefore: Decorators[], appliesAfter: Decorators[] }
create WeakDecoratorRef = {module, name}


create WeaverPlugin:
 - DuplicateAspectHandler
 - DevAspectHandler


test global weaver & named weaver


