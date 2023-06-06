import { defineClientConfig } from "@vuepress/client";

import { Layout, NotFound, useScrollPromise, injectDarkmode, setupDarkmode, setupSidebarItems } from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-theme-hope/lib/bundle/export.js";

import { HopeIcon } from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-theme-hope/lib/bundle/export.js";
import { defineAutoCatalogIconComponent } from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-auto-catalog/lib/client/index.js"

import "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-theme-hope/lib/bundle/styles/all.scss";

defineAutoCatalogIconComponent(HopeIcon);

export default defineClientConfig({
  enhance: ({ app, router }) => {
    const { scrollBehavior } = router.options;

    router.options.scrollBehavior = async (...args) => {
      await useScrollPromise().wait();

      return scrollBehavior(...args);
    };

    // inject global properties
    injectDarkmode(app);


  },
  setup: () => {
    setupDarkmode();
    setupSidebarItems();

  },
  layouts: {
    Layout,
    NotFound,

  }
});