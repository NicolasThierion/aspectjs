import { Page, PluginConfig, Theme } from 'vuepress';
import { hopeTheme } from 'vuepress-theme-hope';
import { createNavbar } from './navbar/navbar';
import { customNavbar } from './navbar/navbar.plugin';
import { createSidebar } from './sidebar/sidebar';

import { searchProPlugin } from 'vuepress-plugin-search-pro';
import { sidebarSorter } from './sidebar/sidebar-sorter';
import { typedocPluginConfig } from './typedoc/typedoc.plugin';

export default function customTheme(): Theme {
  const plugins: PluginConfig = [
    customNavbar(),
    typedocPluginConfig(),
    searchProPlugin({
      indexContent: true,
      customFields: [
        {
          getter: (page: Page) => page.frontmatter.category as any,
          formatter: 'Category: $content',
        },
        {
          getter: (page: Page) => page.frontmatter.tag,
          formatter: 'Tag: $content',
        },
      ],
      // your options
    }),
  ];

  return {
    name: 'custom',
    plugins,
    extends: hopeTheme({
      hostname: 'https://vuepress-theme-hope-docs-demo.netlify.app',
      sidebarSorter: sidebarSorter,
      author: {
        name: 'Nicolas T.',
        // url: 'https://mrhope.site',
      },

      iconAssets: 'fontawesome-with-brands',

      logo: '/logo.png',

      repo: 'vuepress-theme-hope/vuepress-theme-hope',

      docsDir: 'demo/theme-docs/src',

      locales: {
        '/': {
          // navbar
          navbar: createNavbar('/'),
          // sidebar
          sidebar: createSidebar('/'),
          displayFooter: true,

          metaLocales: {
            editLink: 'Edit this page on GitHub',
          },
        },
        // '/fr/': {
        //   // navbar
        //   navbar: createNavbar('/fr/'),
        //   // sidebar
        //   sidebar: createSidebar('/fr/'),
        //   displayFooter: true,

        //   // page meta
        //   metaLocales: {
        //     editLink: 'Editer sur GitHub',
        //   },
        // },
      },

      plugins: {
        // all features are enabled for demo, only preserve features you need here
        mdEnhance: {
          align: true,
          attrs: true,
          chart: true,
          codetabs: true,
          demo: true,
          echarts: true,
          figure: true,
          flowchart: true,
          gfm: true,
          imgLazyload: true,
          imgSize: true,
          include: true,
          // katex: true,
          mark: true,
          // mermaid: true,
          playground: {
            presets: ['ts'],
          },
          stylize: [
            {
              matcher: 'Recommended',
              replacer: ({ tag }) => {
                if (tag === 'em')
                  return {
                    tag: 'Badge',
                    attrs: { type: 'tip' },
                    content: 'Recommended',
                  };
              },
            },
          ],
          sub: true,
          sup: true,
          tabs: true,
          vPre: true,
          vuePlayground: true,
        },

        // uncomment these if you want a pwa
        // pwa: {
        //   favicon: "/favicon.ico",
        //   cacheHTML: true,
        //   cachePic: true,
        //   appendBase: true,
        //   apple: {
        //     icon: "/assets/icon/apple-icon-152.png",
        //     statusBarColor: "black",
        //   },
        //   msTile: {
        //     image: "/assets/icon/ms-icon-144.png",
        //     color: "#ffffff",
        //   },
        //   manifest: {
        //     icons: [
        //       {
        //         src: "/assets/icon/chrome-mask-512.png",
        //         sizes: "512x512",
        //         purpose: "maskable",
        //         type: "image/png",
        //       },
        //       {
        //         src: "/assets/icon/chrome-mask-192.png",
        //         sizes: "192x192",
        //         purpose: "maskable",
        //         type: "image/png",
        //       },
        //       {
        //         src: "/assets/icon/chrome-512.png",
        //         sizes: "512x512",
        //         type: "image/png",
        //       },
        //       {
        //         src: "/assets/icon/chrome-192.png",
        //         sizes: "192x192",
        //         type: "image/png",
        //       },
        //     ],
        //     shortcuts: [
        //       {
        //         name: "Demo",
        //         short_name: "Demo",
        //         url: "/demo/",
        //         icons: [
        //           {
        //             src: "/assets/icon/guide-maskable.png",
        //             sizes: "192x192",
        //             purpose: "maskable",
        //             type: "image/png",
        //           },
        //         ],
        //       },
        //     ],
        //   },
        // },
      },
    }),
  };
}
