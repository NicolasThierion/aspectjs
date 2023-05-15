import { hopeTheme, SidebarInfo } from 'vuepress-theme-hope';
import { createNavbar } from './navbar/navbar';
import { createSidebar } from './sidebar/sidebar';
import { PluginConfig, Theme } from 'vuepress';
import { customNavbar } from './navbar/navbar.plugin';

export default function customTheme(): Theme {
  const plugins: PluginConfig = [customNavbar()];
  return {
    name: 'custom',
    plugins,
    extends: hopeTheme({
      hostname: 'https://vuepress-theme-hope-docs-demo.netlify.app',
      sidebarSorter: (infoA: SidebarInfo | any, infoB: SidebarInfo | any) => {
        const rx = /^(?<order>\d+).*$/;

        const orderA =
          infoA.order ??
          (infoA.filename ?? infoA.dirname).match(rx)?.groups?.order ??
          Infinity;

        const orderB =
          infoB.order ??
          (infoB.filename ?? infoB.dirname).match(rx)?.groups?.order ??
          Infinity;

        return +orderA - +orderB;
      },
      author: {
        name: 'Mr.Hope',
        url: 'https://mrhope.site',
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

          // footer: "Default footer",

          displayFooter: true,

          metaLocales: {
            editLink: 'Edit this page on GitHub',
          },
        },

        /**
         * Chinese locale config
         */
        '/fr/': {
          // navbar
          navbar: createNavbar('/fr/'),
          // sidebar
          sidebar: createSidebar('/fr/'),
          displayFooter: true,

          // page meta
          metaLocales: {
            editLink: 'Editer sur GitHub',
          },
        },
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
