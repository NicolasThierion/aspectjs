import { Page, PluginConfig, Theme } from 'vuepress';
import { hopeTheme } from 'vuepress-theme-hope';
import { createNavbar } from './navbar/navbar';
import { customNavbar } from './navbar/navbar.plugin';
import { createSidebar } from './sidebar/sidebar';

import { extendsMarkdown } from './custom-blocks/custom-md';
import { TYPEDOC_ENTRYPOINTS } from './run-typedoc';
import { sidebarSorter } from './sidebar/sidebar-sorter';
import { typedocPluginConfig } from './typedoc/typedoc.plugin';

export default function customTheme(): Theme {
  const plugins: PluginConfig = [
    customNavbar(),
    typedocPluginConfig(TYPEDOC_ENTRYPOINTS),
    {
      name: 'custom-markdown',
      extendsMarkdown: (md) => {
        extendsMarkdown(md);
      },
    },
  ];

  return {
    name: 'custom',
    plugins,
    extends: hopeTheme({
      hostname: 'https://aspectjs.gitlab.io/',
      sidebarSorter: sidebarSorter,
      author: {
        name: 'Nicolas T.',
        // url: 'https://mrhope.site',
      },

      iconAssets: 'fontawesome-with-brands',
      logo: '/logo.png',
      repo: 'https://github.com/NicolasThierion/aspectjs',
      docsDir: 'packages/docs/src',
      editLinkPattern:
        'https://gitlab.com/aspectjs/aspectjs/-/blob/:branch/:path',
      locales: {
        '/': {
          // navbar
          navbar: createNavbar('/'),
          // sidebar
          sidebar: createSidebar('/'),
          displayFooter: true,

          // metaLocales: {
          //   editLink: 'Edit this page on Gitlab',
          // },
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
        searchPro: {
          autoSuggestions: false,
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
        },
        // all features are enabled for demo, only preserve features you need here
        mdEnhance: {
          align: false,
          attrs: false,
          chart: false,
          codetabs: true,
          demo: false,
          echarts: false,
          figure: false,
          flowchart: false,
          gfm: false,
          imgLazyload: false,
          imgSize: false,
          include: false,
          // katex: false,
          mark: true,
          // mermaid: false,
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
          sub: false,
          sup: false,
          tabs: true,
          vPre: true,
          vuePlayground: false,
        },
        prismjs: {
          themes: {
            light: 'gruvbox-light',
            dark: 'gruvbox-dark',
          },
          // light: 'one-dark',
          // ateliersulphurpool-light
          // coldark-cold
          // coy
          // duotone-light
          // ghcolors
          // gruvbox-light
          // material-light
          // one-light
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
