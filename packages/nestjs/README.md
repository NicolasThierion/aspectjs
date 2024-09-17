# @aspectjs/nestjs

## 💡 Why ?

NestJS heavily relies on [experimental decorators](https://github.com/tc39/proposal-decorators) to provide a clean and modern design architecture based on AOP.  
This package offers a conversion of some NestJS decorators into **AspectJS annotations**, allowing you to repurpose these annotations with external aspects.

By themselves, the annotations do nothing, but they require the activation of third-party aspects to introduce actual behavior.

## ⚙️ Installation

```bash
npm i @aspectjs/nestjs
```

## 📜 Documentation

### `@aspectjs/nestjs/common`

This package binds the following annotations from `@nestjs/common`: 

| Annotation      |
|-----------------|
| `Body()`        |
| `Delete()`      |
| `Get()`         |
| `Head()`        |
| `Header()`      |
| `Headers()`     |
| `Injectable()`  |
| `Options()`     |
| `Param()`       |
| `Patch()`       |
| `Post()`        |
| `Put()`         |
| `Query()`       |