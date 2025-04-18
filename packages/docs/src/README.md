---
home: true
icon: home
title: AspectJS
heroImage: /logo.png
heroText: AspectJS
tagline: The AOP framework for Javascript, Typescript, Browser & Node.
actions:
  - text: How to Use 💡
    link: /00.guide/001.getting-started.html
    type: primary
  - text: Why ❔
    link: /00.guide/000.motivations.html
  - text: API documentation 📑
    link: /api/modules.html

features:
  - title: Node & Browser
    icon: globe
    details: Works both on Node and browser
  - title: Modular
    icon: cubes
    details: Works on both node and browser
  - title: Plug and play
    icon: plug
    details: Install the packages, and start enhancing your existing code with aspects
  #- title: Lightweight
  #  icon: bolt
  #  details: Less than 15kb minified
  - title: Cleaner, lesser code
    icon: link
    details: More cohesion and less boilerplate in your code

copyright: false
footer: Theme by <a href="https://theme-hope.vuejs.press/" target="_blank">VuePress Theme Hope</a> | MIT Licensed

head:
  - - meta
    - name: keywords
      content: AOP
    - name: keywords
      content: documentation
---

## <i class="fa fa-download"></i> Installation

:::code-tabs
@tab npm

```bash
npm i @aspectjs/common @aspectjs/core
```

@tab yarn

```bash
yarn add @aspectjs/common @aspectjs/core
```

:::
Benefits of using _AOP_

- **Separation of Concerns**: Promotes the separation of concerns, allowing you to focus on the core logic of your code while handling cross-cutting concerns separately.
- **Code Reusability**: Allows you to write reusable aspects that can be applied to multiple classes in your code, reducing code duplication and improving reusability.
- **Consistency**: Provides a consistent and centralized approach to applying behaviors and policies across your application.
- **Dynamic Behavior**: Supports dynamic behavior by allowing aspects to be applied at runtime, enabling flexibility and adaptability.
- **Maintainability**: Makes it easier to maintain your codebase by isolating boilerplate code and making the codebase more concise and clean.


## 🎉 Demo:

<iframe src="https://stackblitz.com/edit/aspectjs-demo-0-5-1?file=index.html" width="100%" height="540px" border="none"></iframe>
