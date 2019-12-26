Typescript users: 

Remember to put the following in `tsconfig.json` so that method decorators work
```json
{
  "compilerOptions": {
    "target": "es5"
  }
}
```