// src/.vuepress/config.ts
import { defineUserConfig } from "vuepress";

// src/.vuepress/locales.ts
var LOCALES = {
  "/": {
    lang: "en-US",
    title: "AspectJS documentation",
    description: "Documentation for the AspectJS framework"
  }
  // '/fr/': {
  //   lang: 'fr-FR',
  //   title: 'AspectJS documentation',
  //   description: 'Documentation for the AspectJS framework',
  // },
};

// src/.vuepress/theme.ts
import { hopeTheme } from "vuepress-theme-hope";

// src/.vuepress/navbar/navbar.ts
import { path as path2 } from "@vuepress/utils";
import { navbar } from "vuepress-theme-hope";

// src/.vuepress/md/utils.ts
import { existsSync, readFileSync, readdirSync } from "fs";
import { path } from "@vuepress/utils";
import { createMarkdown } from "@vuepress/markdown";

// src/.vuepress/utils.ts
import { dirname, join } from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///home/nicolas/projects/aspectjs2/packages/docs/src/.vuepress/utils.ts";
var ROOT_DIR = join(fileURLToPath(dirname(__vite_injected_original_import_meta_url)), "..");

// src/.vuepress/md/utils.ts
function listMdDirs(root = ".") {
  return readdirSync(path.join(ROOT_DIR, root), {
    withFileTypes: true
  }).filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name).filter((d) => listMdFiles(path.join(root, d), false).length);
}
function findIndexMd(dir, filename = "README.md") {
  const file = path.join(ROOT_DIR, dir, filename);
  return existsSync(file) ? path.relative(ROOT_DIR, file) : void 0;
}
function extractInfo(filename) {
  var _a, _b;
  let env = {};
  createMarkdown({
    headers: {
      level: [1, 2, 3, 4]
    }
  }).render(readFileSync(path.join(ROOT_DIR, filename)).toString(), env);
  const title = ((_a = env.headers.sort((h1, h2) => h1.level - h2.level)[0]) == null ? void 0 : _a.title) ?? filename;
  const icon = ((_b = env.frontmatter) == null ? void 0 : _b.icon) ?? "";
  return { title, icon };
}
function listMdFiles(dirname3, filterIgnored = true) {
  const dir = path.join(ROOT_DIR, dirname3);
  return readdirSync(dir, { withFileTypes: true }).filter((f) => f.isFile() && f.name.endsWith(".md")).map((f) => f.name).filter((filepath) => !path.basename(filepath).startsWith("_")).filter((f) => {
    if (!filterIgnored) {
      return true;
    }
    const env = {};
    createMarkdown({}).render(
      readFileSync(path.join(dir, f)).toString(),
      env
    );
    return env.frontmatter.index !== false;
  }).sort(
    (s1, s2) => s1.localeCompare(s2, "en", {
      numeric: true,
      ignorePunctuation: true
    })
  );
}

// src/.vuepress/navbar/navbar.ts
function findFirstMd(dir) {
  const md = listMdFiles(dir)[0];
  if (md) {
    return md;
  }
  return listMdDirs(dir).map(
    (d) => path2.join(d, findFirstMd(path2.join(dir, d)))
  )[0];
}
function createNavbar(localePrefix = "/") {
  const localesDirs = Object.keys(LOCALES).filter((l) => l !== localePrefix).map((l) => l.replaceAll("/", ""));
  const dirs = listMdDirs(localePrefix).filter((d) => !localesDirs.includes(d));
  return navbar([
    "/",
    ...dirs.map((d) => [d, findIndexMd(d)]).filter(([_dir, index]) => !!index).map(([dir, index]) => {
      const md = findFirstMd(dir);
      [0];
      const { icon, title } = extractInfo(index);
      return {
        text: title,
        link: `${localePrefix}${dir}/${md}`,
        icon
      };
    })
  ]);
}

// src/.vuepress/navbar/navbar.plugin.ts
import chokidar from "chokidar";
function computeNavbar(app) {
  app;
}
var customNavbar = () => {
  return (app) => {
    return {
      name: "custom-navbar",
      onInitialized: (app2) => {
      },
      define: (app2) => {
      },
      onWatched: (app2, watchers, reload) => {
        const pagesWatcher = chokidar.watch(app2.options.pagePatterns, {
          cwd: app2.dir.source(),
          ignoreInitial: true
        });
        pagesWatcher.on("add", async (filePathRelative) => {
          reload();
        });
        pagesWatcher.on("unlink", async (filePathRelative) => {
          reload();
          computeNavbar(app2);
        });
        watchers.push(pagesWatcher);
      },
      extendsPage: (page) => {
      }
    };
  };
};

// src/.vuepress/sidebar/sidebar.ts
import { path as path3 } from "@vuepress/utils";
import { lstatSync } from "fs";
import {
  sidebar
} from "vuepress-theme-hope";

// src/.vuepress/sidebar/sidebar-sorter.ts
function sidebarSorter(infoA, infoB) {
  var _a, _b, _c, _d;
  if (infoA.filename === "README.md") {
    return 1;
  }
  const rx = /^(?<order>\d+).*$/;
  if (infoA.type === "file" && infoB.type === "dir") {
    return -1;
  } else if (infoA.type === "dir" && infoB.type === "file") {
    return 1;
  }
  const orderA = infoA.order ?? ((_b = (_a = (infoA.filename ?? infoA.dirname).match(rx)) == null ? void 0 : _a.groups) == null ? void 0 : _b.order) ?? Infinity;
  const orderB = infoB.order ?? ((_d = (_c = (infoB.filename ?? infoB.dirname).match(rx)) == null ? void 0 : _c.groups) == null ? void 0 : _d.order) ?? Infinity;
  if (orderA === orderB) {
    return (infoA.filename ?? infoA.dirname).localeCompare(
      infoB.filename ?? infoB.dirname,
      "en",
      {
        numeric: true,
        ignorePunctuation: true
      }
    );
  }
  return +orderA - +orderB;
}

// src/.vuepress/sidebar/sidebar.ts
var COLLABSIBLE_LENGTH_THRESHOLD = 7;
function buildSidebarItems(dir) {
  const children = listMdFiles(dir).map((filename) => {
    const filepath = path3.join(dir, filename);
    return [filename, filepath, filepath];
  }).concat(
    listMdDirs(dir).map((filename) => {
      const filepath = path3.join(dir, filename);
      return [filename, filepath, buildSidebarItems(filepath)];
    })
  ).sort(([filename1, filepath1], [filename2, filepath2]) => {
    return sidebarSorter(
      {
        filename: filename1,
        type: lstatSync(path3.join(ROOT_DIR, filepath1)).isDirectory() ? "dir" : "file"
      },
      {
        filename: filename2,
        type: lstatSync(path3.join(ROOT_DIR, filepath2)).isDirectory() ? "dir" : "file"
      }
    );
  }).map(([_filenaem, _filepath, config]) => config);
  const mdIndex = findIndexMd(dir);
  const basename = path3.basename(dir);
  const { icon, title } = mdIndex ? extractInfo(mdIndex) : {
    icon: "",
    title: `${basename.charAt(0).toUpperCase()}${basename.slice(1)}`
  };
  return {
    text: title,
    icon,
    children,
    collapsible: (children == null ? void 0 : children.length) > COLLABSIBLE_LENGTH_THRESHOLD
  };
}
function createSidebar(localePrefix = "/") {
  console.log("createSidebar");
  const localesDirs = Object.keys(LOCALES).filter((l) => l !== localePrefix).map((l) => l.replaceAll("/", ""));
  const dirs = listMdDirs(localePrefix).filter((d) => !localesDirs.includes(d)).map((d) => path3.join(localePrefix, d));
  return sidebar(
    dirs.reduce((options, dir) => {
      var _a;
      const config = buildSidebarItems(dir);
      config.collapsible;
      return {
        ...options,
        [`${dir}/`]: [config],
        collapsible: ((_a = config.children) == null ? void 0 : _a.length) > COLLABSIBLE_LENGTH_THRESHOLD
      };
    }, {})
  );
}

// src/.vuepress/theme.ts
import { searchProPlugin } from "vuepress-plugin-search-pro";

// src/.vuepress/typedoc/typedoc.plugin.ts
import chokidar2 from "chokidar";
import { findUpSync } from "find-up";
import { readFileSync as readFileSync2 } from "fs";
import { globSync } from "glob";
import json5 from "json5";
import { dirname as dirname2, join as join2 } from "path";
import * as url from "url";
import { typedocPlugin } from "vuepress-plugin-typedoc/next";
var __vite_injected_original_dirname = "/home/nicolas/projects/aspectjs2/packages/docs/src/.vuepress/typedoc";
var __vite_injected_original_import_meta_url2 = "file:///home/nicolas/projects/aspectjs2/packages/docs/src/.vuepress/typedoc/typedoc.plugin.ts";
var { parse } = json5;
function typedocPluginConfig() {
  const entryPoints = findEntrypoints();
  return (...args) => {
    const plugin = typedocPlugin({
      // plugin options
      entryPoints,
      tsconfig: `${__vite_injected_original_dirname}/tsconfig.json`,
      cleanOutputDir: true,
      name: "AspectJS",
      readme: join2(__vite_injected_original_dirname, "README.typedoc.md"),
      excludeInternal: true,
      excludePrivate: true,
      excludeExternals: true,
      groupOrder: ["Modules", "Variables", "Functions", "*"],
      // categorizeByGroup: false,
      // navigation: {
      //   includeCategories: false,
      //   includeGroups: false,
      // },
      // Plugin options
      out: "api",
      sidebar: {
        // fullNames: true,
        parentCategory: "API"
      }
    })(...args);
    return {
      ...plugin,
      onWatched: (app, watchers, reload) => {
        const pagesWatcher = chokidar2.watch(
          entryPoints.map((e) => dirname2(e)).map((e) => join2(e, "**/*.ts")),
          {
            cwd: app.dir.source(),
            ignoreInitial: true
          }
        );
        pagesWatcher.on("add", async (filePathRelative) => {
          reload();
        });
        pagesWatcher.on("change", async (filePathRelative) => {
          reload();
        });
        pagesWatcher.on("unlink", async (filePathRelative) => {
          reload();
        });
        watchers.push(pagesWatcher);
      }
    };
  };
}
function findEntrypoints() {
  const __dirname2 = url.fileURLToPath(new URL(".", __vite_injected_original_import_meta_url2));
  const rootPackagePath = findUpSync("package.json", {
    cwd: join2(dirname2(findUpSync("package.json", { cwd: __dirname2 })), "..")
  });
  if (!rootPackagePath) {
    throw new Error("Could not find package.json");
  }
  const packageJson = parse(readFileSync2(rootPackagePath, "utf-8"));
  const workspaceDir = dirname2(rootPackagePath);
  const packageJsons = (packageJson.workspaces ?? []).map((p) => join2(workspaceDir, p)).concat(join2(workspaceDir, "*")).flatMap((d) => globSync(join2(d, "package.json")));
  const entrypointPattern = "index.ts";
  return packageJsons.map((d) => dirname2(d)).flatMap((d) => globSync(join2(d, entrypointPattern)));
}

// src/.vuepress/theme.ts
function customTheme() {
  const plugins = [
    customNavbar(),
    typedocPluginConfig(),
    searchProPlugin({
      indexContent: true,
      customFields: [
        {
          getter: (page) => page.frontmatter.category,
          formatter: "Category: $content"
        },
        {
          getter: (page) => page.frontmatter.tag,
          formatter: "Tag: $content"
        }
      ]
      // your options
    })
  ];
  return {
    name: "custom",
    plugins,
    extends: hopeTheme({
      hostname: "https://vuepress-theme-hope-docs-demo.netlify.app",
      sidebarSorter,
      author: {
        name: "Nicolas T."
        // url: 'https://mrhope.site',
      },
      iconAssets: "fontawesome-with-brands",
      logo: "/logo.png",
      repo: "vuepress-theme-hope/vuepress-theme-hope",
      docsDir: "demo/theme-docs/src",
      locales: {
        "/": {
          // navbar
          navbar: createNavbar("/"),
          // sidebar
          sidebar: createSidebar("/"),
          displayFooter: true,
          metaLocales: {
            editLink: "Edit this page on GitHub"
          }
        }
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
            presets: ["ts"]
          },
          stylize: [
            {
              matcher: "Recommended",
              replacer: ({ tag }) => {
                if (tag === "em")
                  return {
                    tag: "Badge",
                    attrs: { type: "tip" },
                    content: "Recommended"
                  };
              }
            }
          ],
          sub: true,
          sup: true,
          tabs: true,
          vPre: true,
          vuePlayground: true
        }
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
      }
    })
  };
}

// src/.vuepress/config.ts
debugger;
var config_default = defineUserConfig({
  base: "/",
  locales: LOCALES,
  theme: customTheme
  // Enable it with pwa
  // shouldPrefetch: false,
});
export {
  config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjLy52dWVwcmVzcy9jb25maWcudHMiLCAic3JjLy52dWVwcmVzcy9sb2NhbGVzLnRzIiwgInNyYy8udnVlcHJlc3MvdGhlbWUudHMiLCAic3JjLy52dWVwcmVzcy9uYXZiYXIvbmF2YmFyLnRzIiwgInNyYy8udnVlcHJlc3MvbWQvdXRpbHMudHMiLCAic3JjLy52dWVwcmVzcy91dGlscy50cyIsICJzcmMvLnZ1ZXByZXNzL25hdmJhci9uYXZiYXIucGx1Z2luLnRzIiwgInNyYy8udnVlcHJlc3Mvc2lkZWJhci9zaWRlYmFyLnRzIiwgInNyYy8udnVlcHJlc3Mvc2lkZWJhci9zaWRlYmFyLXNvcnRlci50cyIsICJzcmMvLnZ1ZXByZXNzL3R5cGVkb2MvdHlwZWRvYy5wbHVnaW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzMi9wYWNrYWdlcy9kb2NzL3NyYy8udnVlcHJlc3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy9jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzL2NvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZVVzZXJDb25maWcgfSBmcm9tICd2dWVwcmVzcyc7XG5pbXBvcnQgeyBMT0NBTEVTIH0gZnJvbSAnLi9sb2NhbGVzJztcbmltcG9ydCB0aGVtZSBmcm9tICcuL3RoZW1lLmpzJztcblxuZGVidWdnZXI7XG5leHBvcnQgZGVmYXVsdCBkZWZpbmVVc2VyQ29uZmlnKHtcbiAgYmFzZTogJy8nLFxuXG4gIGxvY2FsZXM6IExPQ0FMRVMsXG5cbiAgdGhlbWUsXG5cbiAgLy8gRW5hYmxlIGl0IHdpdGggcHdhXG4gIC8vIHNob3VsZFByZWZldGNoOiBmYWxzZSxcbn0pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzMi9wYWNrYWdlcy9kb2NzL3NyYy8udnVlcHJlc3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy9sb2NhbGVzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy9sb2NhbGVzLnRzXCI7ZXhwb3J0IGNvbnN0IExPQ0FMRVMgPSB7XG4gICcvJzoge1xuICAgIGxhbmc6ICdlbi1VUycsXG4gICAgdGl0bGU6ICdBc3BlY3RKUyBkb2N1bWVudGF0aW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ0RvY3VtZW50YXRpb24gZm9yIHRoZSBBc3BlY3RKUyBmcmFtZXdvcmsnLFxuICB9LFxuICAvLyAnL2ZyLyc6IHtcbiAgLy8gICBsYW5nOiAnZnItRlInLFxuICAvLyAgIHRpdGxlOiAnQXNwZWN0SlMgZG9jdW1lbnRhdGlvbicsXG4gIC8vICAgZGVzY3JpcHRpb246ICdEb2N1bWVudGF0aW9uIGZvciB0aGUgQXNwZWN0SlMgZnJhbWV3b3JrJyxcbiAgLy8gfSxcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzL3RoZW1lLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy90aGVtZS50c1wiO2ltcG9ydCB7IFBhZ2UsIFBsdWdpbkNvbmZpZywgVGhlbWUgfSBmcm9tICd2dWVwcmVzcyc7XG5pbXBvcnQgeyBob3BlVGhlbWUgfSBmcm9tICd2dWVwcmVzcy10aGVtZS1ob3BlJztcbmltcG9ydCB7IGNyZWF0ZU5hdmJhciB9IGZyb20gJy4vbmF2YmFyL25hdmJhcic7XG5pbXBvcnQgeyBjdXN0b21OYXZiYXIgfSBmcm9tICcuL25hdmJhci9uYXZiYXIucGx1Z2luJztcbmltcG9ydCB7IGNyZWF0ZVNpZGViYXIgfSBmcm9tICcuL3NpZGViYXIvc2lkZWJhcic7XG5cbmltcG9ydCB7IHNlYXJjaFByb1BsdWdpbiB9IGZyb20gJ3Z1ZXByZXNzLXBsdWdpbi1zZWFyY2gtcHJvJztcbmltcG9ydCB7IHNpZGViYXJTb3J0ZXIgfSBmcm9tICcuL3NpZGViYXIvc2lkZWJhci1zb3J0ZXInO1xuaW1wb3J0IHsgdHlwZWRvY1BsdWdpbkNvbmZpZyB9IGZyb20gJy4vdHlwZWRvYy90eXBlZG9jLnBsdWdpbic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGN1c3RvbVRoZW1lKCk6IFRoZW1lIHtcbiAgY29uc3QgcGx1Z2luczogUGx1Z2luQ29uZmlnID0gW1xuICAgIGN1c3RvbU5hdmJhcigpLFxuICAgIHR5cGVkb2NQbHVnaW5Db25maWcoKSxcbiAgICBzZWFyY2hQcm9QbHVnaW4oe1xuICAgICAgaW5kZXhDb250ZW50OiB0cnVlLFxuICAgICAgY3VzdG9tRmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBnZXR0ZXI6IChwYWdlOiBQYWdlKSA9PiBwYWdlLmZyb250bWF0dGVyLmNhdGVnb3J5IGFzIGFueSxcbiAgICAgICAgICBmb3JtYXR0ZXI6ICdDYXRlZ29yeTogJGNvbnRlbnQnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZ2V0dGVyOiAocGFnZTogUGFnZSkgPT4gcGFnZS5mcm9udG1hdHRlci50YWcsXG4gICAgICAgICAgZm9ybWF0dGVyOiAnVGFnOiAkY29udGVudCcsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgLy8geW91ciBvcHRpb25zXG4gICAgfSksXG4gIF07XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnY3VzdG9tJyxcbiAgICBwbHVnaW5zLFxuICAgIGV4dGVuZHM6IGhvcGVUaGVtZSh7XG4gICAgICBob3N0bmFtZTogJ2h0dHBzOi8vdnVlcHJlc3MtdGhlbWUtaG9wZS1kb2NzLWRlbW8ubmV0bGlmeS5hcHAnLFxuICAgICAgc2lkZWJhclNvcnRlcjogc2lkZWJhclNvcnRlcixcbiAgICAgIGF1dGhvcjoge1xuICAgICAgICBuYW1lOiAnTmljb2xhcyBULicsXG4gICAgICAgIC8vIHVybDogJ2h0dHBzOi8vbXJob3BlLnNpdGUnLFxuICAgICAgfSxcblxuICAgICAgaWNvbkFzc2V0czogJ2ZvbnRhd2Vzb21lLXdpdGgtYnJhbmRzJyxcblxuICAgICAgbG9nbzogJy9sb2dvLnBuZycsXG5cbiAgICAgIHJlcG86ICd2dWVwcmVzcy10aGVtZS1ob3BlL3Z1ZXByZXNzLXRoZW1lLWhvcGUnLFxuXG4gICAgICBkb2NzRGlyOiAnZGVtby90aGVtZS1kb2NzL3NyYycsXG5cbiAgICAgIGxvY2FsZXM6IHtcbiAgICAgICAgJy8nOiB7XG4gICAgICAgICAgLy8gbmF2YmFyXG4gICAgICAgICAgbmF2YmFyOiBjcmVhdGVOYXZiYXIoJy8nKSxcbiAgICAgICAgICAvLyBzaWRlYmFyXG4gICAgICAgICAgc2lkZWJhcjogY3JlYXRlU2lkZWJhcignLycpLFxuICAgICAgICAgIGRpc3BsYXlGb290ZXI6IHRydWUsXG5cbiAgICAgICAgICBtZXRhTG9jYWxlczoge1xuICAgICAgICAgICAgZWRpdExpbms6ICdFZGl0IHRoaXMgcGFnZSBvbiBHaXRIdWInLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIC8vICcvZnIvJzoge1xuICAgICAgICAvLyAgIC8vIG5hdmJhclxuICAgICAgICAvLyAgIG5hdmJhcjogY3JlYXRlTmF2YmFyKCcvZnIvJyksXG4gICAgICAgIC8vICAgLy8gc2lkZWJhclxuICAgICAgICAvLyAgIHNpZGViYXI6IGNyZWF0ZVNpZGViYXIoJy9mci8nKSxcbiAgICAgICAgLy8gICBkaXNwbGF5Rm9vdGVyOiB0cnVlLFxuXG4gICAgICAgIC8vICAgLy8gcGFnZSBtZXRhXG4gICAgICAgIC8vICAgbWV0YUxvY2FsZXM6IHtcbiAgICAgICAgLy8gICAgIGVkaXRMaW5rOiAnRWRpdGVyIHN1ciBHaXRIdWInLFxuICAgICAgICAvLyAgIH0sXG4gICAgICAgIC8vIH0sXG4gICAgICB9LFxuXG4gICAgICBwbHVnaW5zOiB7XG4gICAgICAgIC8vIGFsbCBmZWF0dXJlcyBhcmUgZW5hYmxlZCBmb3IgZGVtbywgb25seSBwcmVzZXJ2ZSBmZWF0dXJlcyB5b3UgbmVlZCBoZXJlXG4gICAgICAgIG1kRW5oYW5jZToge1xuICAgICAgICAgIGFsaWduOiB0cnVlLFxuICAgICAgICAgIGF0dHJzOiB0cnVlLFxuICAgICAgICAgIGNoYXJ0OiB0cnVlLFxuICAgICAgICAgIGNvZGV0YWJzOiB0cnVlLFxuICAgICAgICAgIGRlbW86IHRydWUsXG4gICAgICAgICAgZWNoYXJ0czogdHJ1ZSxcbiAgICAgICAgICBmaWd1cmU6IHRydWUsXG4gICAgICAgICAgZmxvd2NoYXJ0OiB0cnVlLFxuICAgICAgICAgIGdmbTogdHJ1ZSxcbiAgICAgICAgICBpbWdMYXp5bG9hZDogdHJ1ZSxcbiAgICAgICAgICBpbWdTaXplOiB0cnVlLFxuICAgICAgICAgIGluY2x1ZGU6IHRydWUsXG4gICAgICAgICAgLy8ga2F0ZXg6IHRydWUsXG4gICAgICAgICAgbWFyazogdHJ1ZSxcbiAgICAgICAgICAvLyBtZXJtYWlkOiB0cnVlLFxuICAgICAgICAgIHBsYXlncm91bmQ6IHtcbiAgICAgICAgICAgIHByZXNldHM6IFsndHMnXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN0eWxpemU6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbWF0Y2hlcjogJ1JlY29tbWVuZGVkJyxcbiAgICAgICAgICAgICAgcmVwbGFjZXI6ICh7IHRhZyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRhZyA9PT0gJ2VtJylcbiAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHRhZzogJ0JhZGdlJyxcbiAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHsgdHlwZTogJ3RpcCcgfSxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogJ1JlY29tbWVuZGVkJyxcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgc3ViOiB0cnVlLFxuICAgICAgICAgIHN1cDogdHJ1ZSxcbiAgICAgICAgICB0YWJzOiB0cnVlLFxuICAgICAgICAgIHZQcmU6IHRydWUsXG4gICAgICAgICAgdnVlUGxheWdyb3VuZDogdHJ1ZSxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyB1bmNvbW1lbnQgdGhlc2UgaWYgeW91IHdhbnQgYSBwd2FcbiAgICAgICAgLy8gcHdhOiB7XG4gICAgICAgIC8vICAgZmF2aWNvbjogXCIvZmF2aWNvbi5pY29cIixcbiAgICAgICAgLy8gICBjYWNoZUhUTUw6IHRydWUsXG4gICAgICAgIC8vICAgY2FjaGVQaWM6IHRydWUsXG4gICAgICAgIC8vICAgYXBwZW5kQmFzZTogdHJ1ZSxcbiAgICAgICAgLy8gICBhcHBsZToge1xuICAgICAgICAvLyAgICAgaWNvbjogXCIvYXNzZXRzL2ljb24vYXBwbGUtaWNvbi0xNTIucG5nXCIsXG4gICAgICAgIC8vICAgICBzdGF0dXNCYXJDb2xvcjogXCJibGFja1wiLFxuICAgICAgICAvLyAgIH0sXG4gICAgICAgIC8vICAgbXNUaWxlOiB7XG4gICAgICAgIC8vICAgICBpbWFnZTogXCIvYXNzZXRzL2ljb24vbXMtaWNvbi0xNDQucG5nXCIsXG4gICAgICAgIC8vICAgICBjb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICAgIC8vICAgfSxcbiAgICAgICAgLy8gICBtYW5pZmVzdDoge1xuICAgICAgICAvLyAgICAgaWNvbnM6IFtcbiAgICAgICAgLy8gICAgICAge1xuICAgICAgICAvLyAgICAgICAgIHNyYzogXCIvYXNzZXRzL2ljb24vY2hyb21lLW1hc2stNTEyLnBuZ1wiLFxuICAgICAgICAvLyAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcbiAgICAgICAgLy8gICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXG4gICAgICAgIC8vICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgLy8gICAgICAgfSxcbiAgICAgICAgLy8gICAgICAge1xuICAgICAgICAvLyAgICAgICAgIHNyYzogXCIvYXNzZXRzL2ljb24vY2hyb21lLW1hc2stMTkyLnBuZ1wiLFxuICAgICAgICAvLyAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcbiAgICAgICAgLy8gICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXG4gICAgICAgIC8vICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgLy8gICAgICAgfSxcbiAgICAgICAgLy8gICAgICAge1xuICAgICAgICAvLyAgICAgICAgIHNyYzogXCIvYXNzZXRzL2ljb24vY2hyb21lLTUxMi5wbmdcIixcbiAgICAgICAgLy8gICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgIC8vICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgLy8gICAgICAgfSxcbiAgICAgICAgLy8gICAgICAge1xuICAgICAgICAvLyAgICAgICAgIHNyYzogXCIvYXNzZXRzL2ljb24vY2hyb21lLTE5Mi5wbmdcIixcbiAgICAgICAgLy8gICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgICAgIC8vICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgLy8gICAgICAgfSxcbiAgICAgICAgLy8gICAgIF0sXG4gICAgICAgIC8vICAgICBzaG9ydGN1dHM6IFtcbiAgICAgICAgLy8gICAgICAge1xuICAgICAgICAvLyAgICAgICAgIG5hbWU6IFwiRGVtb1wiLFxuICAgICAgICAvLyAgICAgICAgIHNob3J0X25hbWU6IFwiRGVtb1wiLFxuICAgICAgICAvLyAgICAgICAgIHVybDogXCIvZGVtby9cIixcbiAgICAgICAgLy8gICAgICAgICBpY29uczogW1xuICAgICAgICAvLyAgICAgICAgICAge1xuICAgICAgICAvLyAgICAgICAgICAgICBzcmM6IFwiL2Fzc2V0cy9pY29uL2d1aWRlLW1hc2thYmxlLnBuZ1wiLFxuICAgICAgICAvLyAgICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgICAgIC8vICAgICAgICAgICAgIHB1cnBvc2U6IFwibWFza2FibGVcIixcbiAgICAgICAgLy8gICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgLy8gICAgICAgICAgIH0sXG4gICAgICAgIC8vICAgICAgICAgXSxcbiAgICAgICAgLy8gICAgICAgfSxcbiAgICAgICAgLy8gICAgIF0sXG4gICAgICAgIC8vICAgfSxcbiAgICAgICAgLy8gfSxcbiAgICAgIH0sXG4gICAgfSksXG4gIH07XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy9uYXZiYXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy9uYXZiYXIvbmF2YmFyLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy9uYXZiYXIvbmF2YmFyLnRzXCI7aW1wb3J0IHsgTmF2YmFySXRlbSB9IGZyb20gJ3Z1ZXByZXNzLXRoZW1lLWhvcGUnO1xuXG5pbXBvcnQgeyBwYXRoIH0gZnJvbSAnQHZ1ZXByZXNzL3V0aWxzJztcbmltcG9ydCB7IG5hdmJhciB9IGZyb20gJ3Z1ZXByZXNzLXRoZW1lLWhvcGUnO1xuaW1wb3J0IHsgTE9DQUxFUyB9IGZyb20gJy4uL2xvY2FsZXMnO1xuaW1wb3J0IHsgZXh0cmFjdEluZm8sIGZpbmRJbmRleE1kLCBsaXN0TWREaXJzLCBsaXN0TWRGaWxlcyB9IGZyb20gJy4uL21kL3V0aWxzJztcblxuZnVuY3Rpb24gZmluZEZpcnN0TWQoZGlyOiBzdHJpbmcpIHtcbiAgY29uc3QgbWQgPSBsaXN0TWRGaWxlcyhkaXIpWzBdO1xuXG4gIGlmIChtZCkge1xuICAgIHJldHVybiBtZDtcbiAgfVxuXG4gIHJldHVybiBsaXN0TWREaXJzKGRpcikubWFwKChkKSA9PlxuICAgIHBhdGguam9pbihkLCBmaW5kRmlyc3RNZChwYXRoLmpvaW4oZGlyLCBkKSkpLFxuICApWzBdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTmF2YmFyKGxvY2FsZVByZWZpeCA9ICcvJykge1xuICBjb25zdCBsb2NhbGVzRGlycyA9IE9iamVjdC5rZXlzKExPQ0FMRVMpXG4gICAgLmZpbHRlcigobCkgPT4gbCAhPT0gbG9jYWxlUHJlZml4KVxuICAgIC5tYXAoKGwpID0+IGwucmVwbGFjZUFsbCgnLycsICcnKSk7XG5cbiAgY29uc3QgZGlycyA9IGxpc3RNZERpcnMobG9jYWxlUHJlZml4KS5maWx0ZXIoKGQpID0+ICFsb2NhbGVzRGlycy5pbmNsdWRlcyhkKSk7XG5cbiAgcmV0dXJuIG5hdmJhcihbXG4gICAgJy8nLFxuICAgIC4uLmRpcnNcbiAgICAgIC5tYXAoKGQpID0+IFtkLCBmaW5kSW5kZXhNZChkKV0pXG4gICAgICAuZmlsdGVyKChbX2RpciwgaW5kZXhdKSA9PiAhIWluZGV4KVxuICAgICAgLm1hcCgoW2RpciwgaW5kZXhdKSA9PiB7XG4gICAgICAgIGNvbnN0IG1kID0gZmluZEZpcnN0TWQoZGlyIGFzIHN0cmluZyk7XG5cbiAgICAgICAgWzBdO1xuICAgICAgICBjb25zdCB7IGljb24sIHRpdGxlIH0gPSBleHRyYWN0SW5mbyhpbmRleCBhcyBzdHJpbmcpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRleHQ6IHRpdGxlLFxuICAgICAgICAgIGxpbms6IGAke2xvY2FsZVByZWZpeH0ke2Rpcn0vJHttZH1gLFxuICAgICAgICAgIGljb24sXG4gICAgICAgIH0gc2F0aXNmaWVzIE5hdmJhckl0ZW07XG4gICAgICB9KSxcbiAgXSk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy9tZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzL21kL3V0aWxzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy9tZC91dGlscy50c1wiO2ltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYywgcmVhZGRpclN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBwYXRoIH0gZnJvbSAnQHZ1ZXByZXNzL3V0aWxzJztcbmltcG9ydCB7IGNyZWF0ZU1hcmtkb3duIH0gZnJvbSAnQHZ1ZXByZXNzL21hcmtkb3duJztcblxuaW1wb3J0IHsgUk9PVF9ESVIgfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0TWREaXJzKHJvb3QgPSAnLicpIHtcbiAgcmV0dXJuIHJlYWRkaXJTeW5jKHBhdGguam9pbihST09UX0RJUiwgcm9vdCksIHtcbiAgICB3aXRoRmlsZVR5cGVzOiB0cnVlLFxuICB9KVxuICAgIC5maWx0ZXIoKGRpcmVudCkgPT4gZGlyZW50LmlzRGlyZWN0b3J5KCkpXG4gICAgLm1hcCgoZGlyZW50KSA9PiBkaXJlbnQubmFtZSlcbiAgICAuZmlsdGVyKChkKSA9PiBsaXN0TWRGaWxlcyhwYXRoLmpvaW4ocm9vdCwgZCksIGZhbHNlKS5sZW5ndGgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZEluZGV4TWQoZGlyOiBzdHJpbmcsIGZpbGVuYW1lID0gJ1JFQURNRS5tZCcpIHtcbiAgY29uc3QgZmlsZSA9IHBhdGguam9pbihST09UX0RJUiwgZGlyLCBmaWxlbmFtZSk7XG4gIHJldHVybiBleGlzdHNTeW5jKGZpbGUpID8gcGF0aC5yZWxhdGl2ZShST09UX0RJUiwgZmlsZSkgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0SW5mbyhmaWxlbmFtZTogc3RyaW5nKSB7XG4gIGxldCBlbnY6IGFueSA9IHt9O1xuXG4gIGNyZWF0ZU1hcmtkb3duKHtcbiAgICBoZWFkZXJzOiB7XG4gICAgICBsZXZlbDogWzEsIDIsIDMsIDRdLFxuICAgIH0sXG4gIH0pLnJlbmRlcihyZWFkRmlsZVN5bmMocGF0aC5qb2luKFJPT1RfRElSLCBmaWxlbmFtZSkpLnRvU3RyaW5nKCksIGVudik7XG5cbiAgY29uc3QgdGl0bGUgPVxuICAgIGVudi5oZWFkZXJzLnNvcnQoKGgxOiBhbnksIGgyOiBhbnkpID0+IGgxLmxldmVsIC0gaDIubGV2ZWwpWzBdPy50aXRsZSA/P1xuICAgIGZpbGVuYW1lO1xuXG4gIGNvbnN0IGljb24gPSBlbnYuZnJvbnRtYXR0ZXI/Lmljb24gPz8gJyc7XG4gIHJldHVybiB7IHRpdGxlLCBpY29uIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0TWRGaWxlcyhkaXJuYW1lOiBzdHJpbmcsIGZpbHRlcklnbm9yZWQgPSB0cnVlKSB7XG4gIGNvbnN0IGRpciA9IHBhdGguam9pbihST09UX0RJUiwgZGlybmFtZSk7XG4gIHJldHVybiByZWFkZGlyU3luYyhkaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KVxuICAgIC5maWx0ZXIoKGYpID0+IGYuaXNGaWxlKCkgJiYgZi5uYW1lLmVuZHNXaXRoKCcubWQnKSlcbiAgICAubWFwKChmKSA9PiBmLm5hbWUpXG4gICAgLmZpbHRlcigoZmlsZXBhdGg6IHN0cmluZykgPT4gIXBhdGguYmFzZW5hbWUoZmlsZXBhdGgpLnN0YXJ0c1dpdGgoJ18nKSlcbiAgICAuZmlsdGVyKChmKSA9PiB7XG4gICAgICBpZiAoIWZpbHRlcklnbm9yZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBjb25zdCBlbnYgPSB7fSBhcyBhbnk7XG4gICAgICBjcmVhdGVNYXJrZG93bih7fSkucmVuZGVyKFxuICAgICAgICByZWFkRmlsZVN5bmMocGF0aC5qb2luKGRpciwgZikpLnRvU3RyaW5nKCksXG4gICAgICAgIGVudixcbiAgICAgICk7XG4gICAgICByZXR1cm4gZW52LmZyb250bWF0dGVyLmluZGV4ICE9PSBmYWxzZTtcbiAgICB9KVxuICAgIC5zb3J0KChzMSwgczIpID0+XG4gICAgICBzMS5sb2NhbGVDb21wYXJlKHMyLCAnZW4nLCB7XG4gICAgICAgIG51bWVyaWM6IHRydWUsXG4gICAgICAgIGlnbm9yZVB1bmN0dWF0aW9uOiB0cnVlLFxuICAgICAgfSksXG4gICAgKTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzMi9wYWNrYWdlcy9kb2NzL3NyYy8udnVlcHJlc3MvdXRpbHMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzL3V0aWxzLnRzXCI7aW1wb3J0IHsgZGlybmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5cbmV4cG9ydCBjb25zdCBST09UX0RJUiA9IGpvaW4oZmlsZVVSTFRvUGF0aChkaXJuYW1lKGltcG9ydC5tZXRhLnVybCkpLCAnLi4nKTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzL25hdmJhclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzL25hdmJhci9uYXZiYXIucGx1Z2luLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy9uYXZiYXIvbmF2YmFyLnBsdWdpbi50c1wiO2ltcG9ydCBjaG9raWRhciBmcm9tICdjaG9raWRhcic7XG5pbXBvcnQgeyBBcHAsIFBsdWdpbkZ1bmN0aW9uIH0gZnJvbSAndnVlcHJlc3MnO1xuXG5mdW5jdGlvbiBjb21wdXRlTmF2YmFyKGFwcDogQXBwKSB7XG4gIGFwcDtcbn1cbmV4cG9ydCBjb25zdCBjdXN0b21OYXZiYXI6ICgpID0+IFBsdWdpbkZ1bmN0aW9uID0gKCkgPT4ge1xuICByZXR1cm4gKGFwcCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiAnY3VzdG9tLW5hdmJhcicsXG4gICAgICBvbkluaXRpYWxpemVkOiAoYXBwKSA9PiB7XG4gICAgICAgIC8vIGFwcC5zaXRlRGF0YS50aXRsZSA9IG0zQ29udGV4dC5uYW1lO1xuICAgICAgICAvLyBhcHAuc2l0ZURhdGEuZGVzY3JpcHRpb24gPSBtM0NvbnRleHQuZGVzY3JpcHRpb247XG4gICAgICB9LFxuICAgICAgZGVmaW5lOiAoYXBwKSA9PiB7fSxcblxuICAgICAgb25XYXRjaGVkOiAoYXBwLCB3YXRjaGVycywgcmVsb2FkKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhZ2VzV2F0Y2hlciA9IGNob2tpZGFyLndhdGNoKGFwcC5vcHRpb25zLnBhZ2VQYXR0ZXJucywge1xuICAgICAgICAgIGN3ZDogYXBwLmRpci5zb3VyY2UoKSxcbiAgICAgICAgICBpZ25vcmVJbml0aWFsOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgcGFnZXNXYXRjaGVyLm9uKCdhZGQnLCBhc3luYyAoZmlsZVBhdGhSZWxhdGl2ZSkgPT4ge1xuICAgICAgICAgIHJlbG9hZCgpO1xuICAgICAgICAgIC8vIGNvbXB1dGVOYXZiYXIoYXBwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHBhZ2VzV2F0Y2hlci5vbignY2hhbmdlJywgYXN5bmMgKGZpbGVQYXRoUmVsYXRpdmUpID0+IHtcbiAgICAgICAgLy8gICByZWxvYWQoKTtcbiAgICAgICAgLy8gICBjb21wdXRlTmF2YmFyKGFwcCk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgICBwYWdlc1dhdGNoZXIub24oJ3VubGluaycsIGFzeW5jIChmaWxlUGF0aFJlbGF0aXZlKSA9PiB7XG4gICAgICAgICAgcmVsb2FkKCk7XG4gICAgICAgICAgY29tcHV0ZU5hdmJhcihhcHApO1xuICAgICAgICB9KTtcblxuICAgICAgICB3YXRjaGVycy5wdXNoKHBhZ2VzV2F0Y2hlcik7XG4gICAgICB9LFxuXG4gICAgICBleHRlbmRzUGFnZTogKHBhZ2UpID0+IHt9LFxuICAgIH07XG4gIH07XG59O1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzMi9wYWNrYWdlcy9kb2NzL3NyYy8udnVlcHJlc3Mvc2lkZWJhclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzL3NpZGViYXIvc2lkZWJhci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzMi9wYWNrYWdlcy9kb2NzL3NyYy8udnVlcHJlc3Mvc2lkZWJhci9zaWRlYmFyLnRzXCI7aW1wb3J0IHsgcGF0aCB9IGZyb20gJ0B2dWVwcmVzcy91dGlscyc7XG5pbXBvcnQgeyBsc3RhdFN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQge1xuICBzaWRlYmFyLFxuICBTaWRlYmFyR3JvdXBJdGVtLFxuICBTaWRlYmFySXRlbSxcbiAgU2lkZWJhck9wdGlvbnMsXG59IGZyb20gJ3Z1ZXByZXNzLXRoZW1lLWhvcGUnO1xuaW1wb3J0IHsgZXh0cmFjdEluZm8sIGZpbmRJbmRleE1kLCBsaXN0TWREaXJzLCBsaXN0TWRGaWxlcyB9IGZyb20gJy4uL21kL3V0aWxzJztcblxuaW1wb3J0IHsgTE9DQUxFUyB9IGZyb20gJy4uL2xvY2FsZXMnO1xuaW1wb3J0IHsgUk9PVF9ESVIgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBzaWRlYmFyU29ydGVyIH0gZnJvbSAnLi9zaWRlYmFyLXNvcnRlcic7XG5jb25zdCBDT0xMQUJTSUJMRV9MRU5HVEhfVEhSRVNIT0xEID0gNztcblxuZnVuY3Rpb24gYnVpbGRTaWRlYmFySXRlbXMoZGlyOiBzdHJpbmcpOiBTaWRlYmFySXRlbSB7XG4gIGNvbnN0IGNoaWxkcmVuOiBTaWRlYmFySXRlbVtdID0gbGlzdE1kRmlsZXMoZGlyKVxuICAgIC8vIC5zb3J0KChzMSwgczIpID0+IHtcbiAgICAvLyAgIGlmIChzMSA9PT0gJ1JFQURNRS5tZCcpIHJldHVybiAxO1xuICAgIC8vICAgcmV0dXJuIHMxLmxvY2FsZUNvbXBhcmUoczIsICdlbicsIHtcbiAgICAvLyAgICAgbnVtZXJpYzogdHJ1ZSxcbiAgICAvLyAgICAgaWdub3JlUHVuY3R1YXRpb246IHRydWUsXG4gICAgLy8gICB9KTtcbiAgICAvLyB9KVxuICAgIC5tYXAoKGZpbGVuYW1lKSA9PiB7XG4gICAgICBjb25zdCBmaWxlcGF0aCA9IHBhdGguam9pbihkaXIsIGZpbGVuYW1lKTtcbiAgICAgIHJldHVybiBbZmlsZW5hbWUsIGZpbGVwYXRoLCBmaWxlcGF0aF07XG4gICAgfSlcbiAgICAuY29uY2F0KFxuICAgICAgbGlzdE1kRGlycyhkaXIpLm1hcCgoZmlsZW5hbWUpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZXBhdGggPSBwYXRoLmpvaW4oZGlyLCBmaWxlbmFtZSk7XG4gICAgICAgIHJldHVybiBbZmlsZW5hbWUsIGZpbGVwYXRoLCBidWlsZFNpZGViYXJJdGVtcyhmaWxlcGF0aCldO1xuICAgICAgfSkgYXMgYW55LFxuICAgIClcbiAgICAuc29ydCgoW2ZpbGVuYW1lMSwgZmlsZXBhdGgxXSwgW2ZpbGVuYW1lMiwgZmlsZXBhdGgyXSkgPT4ge1xuICAgICAgcmV0dXJuIHNpZGViYXJTb3J0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWUxLFxuICAgICAgICAgIHR5cGU6IGxzdGF0U3luYyhwYXRoLmpvaW4oUk9PVF9ESVIsIGZpbGVwYXRoMSkpLmlzRGlyZWN0b3J5KClcbiAgICAgICAgICAgID8gJ2RpcidcbiAgICAgICAgICAgIDogJ2ZpbGUnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lMixcbiAgICAgICAgICB0eXBlOiBsc3RhdFN5bmMocGF0aC5qb2luKFJPT1RfRElSLCBmaWxlcGF0aDIpKS5pc0RpcmVjdG9yeSgpXG4gICAgICAgICAgICA/ICdkaXInXG4gICAgICAgICAgICA6ICdmaWxlJyxcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfSlcbiAgICAubWFwKChbX2ZpbGVuYWVtLCBfZmlsZXBhdGgsIGNvbmZpZ10pID0+IGNvbmZpZyk7XG5cbiAgY29uc3QgbWRJbmRleCA9IGZpbmRJbmRleE1kKGRpcik7XG4gIGNvbnN0IGJhc2VuYW1lID0gcGF0aC5iYXNlbmFtZShkaXIpO1xuICBjb25zdCB7IGljb24sIHRpdGxlIH0gPSBtZEluZGV4XG4gICAgPyBleHRyYWN0SW5mbyhtZEluZGV4KVxuICAgIDoge1xuICAgICAgICBpY29uOiAnJyxcbiAgICAgICAgdGl0bGU6IGAke2Jhc2VuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpfSR7YmFzZW5hbWUuc2xpY2UoMSl9YCxcbiAgICAgIH07XG5cbiAgcmV0dXJuIHtcbiAgICB0ZXh0OiB0aXRsZSxcbiAgICBpY29uLFxuICAgIGNoaWxkcmVuLFxuICAgIGNvbGxhcHNpYmxlOiBjaGlsZHJlbj8ubGVuZ3RoID4gQ09MTEFCU0lCTEVfTEVOR1RIX1RIUkVTSE9MRCxcbiAgfSBzYXRpc2ZpZXMgU2lkZWJhckl0ZW07XG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2lkZWJhcihsb2NhbGVQcmVmaXggPSAnLycpIHtcbiAgY29uc29sZS5sb2coJ2NyZWF0ZVNpZGViYXInKTtcbiAgY29uc3QgbG9jYWxlc0RpcnMgPSBPYmplY3Qua2V5cyhMT0NBTEVTKVxuICAgIC5maWx0ZXIoKGwpID0+IGwgIT09IGxvY2FsZVByZWZpeClcbiAgICAubWFwKChsKSA9PiBsLnJlcGxhY2VBbGwoJy8nLCAnJykpO1xuXG4gIGNvbnN0IGRpcnMgPSBsaXN0TWREaXJzKGxvY2FsZVByZWZpeClcbiAgICAuZmlsdGVyKChkKSA9PiAhbG9jYWxlc0RpcnMuaW5jbHVkZXMoZCkpXG4gICAgLm1hcCgoZCkgPT4gcGF0aC5qb2luKGxvY2FsZVByZWZpeCwgZCkpO1xuXG4gIHJldHVybiBzaWRlYmFyKFxuICAgIGRpcnMucmVkdWNlKChvcHRpb25zOiBhbnksIGRpcikgPT4ge1xuICAgICAgY29uc3QgY29uZmlnOiBTaWRlYmFyR3JvdXBJdGVtID0gYnVpbGRTaWRlYmFySXRlbXMoZGlyKSBhcyBhbnk7XG4gICAgICBjb25maWcuY29sbGFwc2libGU7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBbYCR7ZGlyfS9gXTogW2NvbmZpZ10sXG4gICAgICAgIGNvbGxhcHNpYmxlOiBjb25maWcuY2hpbGRyZW4/Lmxlbmd0aCA+IENPTExBQlNJQkxFX0xFTkdUSF9USFJFU0hPTEQsXG4gICAgICB9IHNhdGlzZmllcyBTaWRlYmFySXRlbTtcbiAgICB9LCB7fSBhcyBhbnkgYXMgU2lkZWJhck9wdGlvbnMpLFxuICApO1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzMi9wYWNrYWdlcy9kb2NzL3NyYy8udnVlcHJlc3Mvc2lkZWJhclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzL3NpZGViYXIvc2lkZWJhci1zb3J0ZXIudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzL3NpZGViYXIvc2lkZWJhci1zb3J0ZXIudHNcIjtpbXBvcnQgeyBTaWRlYmFySW5mbyB9IGZyb20gJ3Z1ZXByZXNzLXRoZW1lLWhvcGUnO1xuXG5leHBvcnQgZnVuY3Rpb24gc2lkZWJhclNvcnRlcihcbiAgaW5mb0E6IFNpZGViYXJJbmZvIHwgYW55LFxuICBpbmZvQjogU2lkZWJhckluZm8gfCBhbnksXG4pIHtcbiAgaWYgKGluZm9BLmZpbGVuYW1lID09PSAnUkVBRE1FLm1kJykge1xuICAgIHJldHVybiAxO1xuICB9XG4gIGNvbnN0IHJ4ID0gL14oPzxvcmRlcj5cXGQrKS4qJC87XG5cbiAgaWYgKGluZm9BLnR5cGUgPT09ICdmaWxlJyAmJiBpbmZvQi50eXBlID09PSAnZGlyJykge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIGlmIChpbmZvQS50eXBlID09PSAnZGlyJyAmJiBpbmZvQi50eXBlID09PSAnZmlsZScpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBjb25zdCBvcmRlckEgPVxuICAgIGluZm9BLm9yZGVyID8/XG4gICAgKGluZm9BLmZpbGVuYW1lID8/IGluZm9BLmRpcm5hbWUpLm1hdGNoKHJ4KT8uZ3JvdXBzPy5vcmRlciA/P1xuICAgIEluZmluaXR5O1xuXG4gIGNvbnN0IG9yZGVyQiA9XG4gICAgaW5mb0Iub3JkZXIgPz9cbiAgICAoaW5mb0IuZmlsZW5hbWUgPz8gaW5mb0IuZGlybmFtZSkubWF0Y2gocngpPy5ncm91cHM/Lm9yZGVyID8/XG4gICAgSW5maW5pdHk7XG5cbiAgaWYgKG9yZGVyQSA9PT0gb3JkZXJCKSB7XG4gICAgcmV0dXJuIChpbmZvQS5maWxlbmFtZSA/PyBpbmZvQS5kaXJuYW1lKS5sb2NhbGVDb21wYXJlKFxuICAgICAgaW5mb0IuZmlsZW5hbWUgPz8gaW5mb0IuZGlybmFtZSxcbiAgICAgICdlbicsXG4gICAgICB7XG4gICAgICAgIG51bWVyaWM6IHRydWUsXG4gICAgICAgIGlnbm9yZVB1bmN0dWF0aW9uOiB0cnVlLFxuICAgICAgfSxcbiAgICApO1xuICB9XG4gIHJldHVybiArb3JkZXJBIC0gK29yZGVyQjtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3RqczIvcGFja2FnZXMvZG9jcy9zcmMvLnZ1ZXByZXNzL3R5cGVkb2NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy90eXBlZG9jL3R5cGVkb2MucGx1Z2luLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMyL3BhY2thZ2VzL2RvY3Mvc3JjLy52dWVwcmVzcy90eXBlZG9jL3R5cGVkb2MucGx1Z2luLnRzXCI7aW1wb3J0IGNob2tpZGFyIGZyb20gJ2Nob2tpZGFyJztcbmltcG9ydCB7IGZpbmRVcFN5bmMgfSBmcm9tICdmaW5kLXVwJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGdsb2JTeW5jIH0gZnJvbSAnZ2xvYic7XG5pbXBvcnQganNvbjUgZnJvbSAnanNvbjUnO1xuaW1wb3J0IHsgZGlybmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgeyBQbHVnaW5GdW5jdGlvbiwgUGx1Z2luT2JqZWN0IH0gZnJvbSAndnVlcHJlc3MnO1xuaW1wb3J0IHsgdHlwZWRvY1BsdWdpbiB9IGZyb20gJ3Z1ZXByZXNzLXBsdWdpbi10eXBlZG9jL25leHQnO1xuY29uc3QgeyBwYXJzZSB9ID0ganNvbjU7XG5leHBvcnQgZnVuY3Rpb24gdHlwZWRvY1BsdWdpbkNvbmZpZygpOiBQbHVnaW5GdW5jdGlvbiB7XG4gIGNvbnN0IGVudHJ5UG9pbnRzID0gZmluZEVudHJ5cG9pbnRzKCk7XG5cbiAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgY29uc3QgcGx1Z2luID0gdHlwZWRvY1BsdWdpbih7XG4gICAgICAvLyBwbHVnaW4gb3B0aW9uc1xuICAgICAgZW50cnlQb2ludHMsXG4gICAgICB0c2NvbmZpZzogYCR7X19kaXJuYW1lfS90c2NvbmZpZy5qc29uYCxcbiAgICAgIGNsZWFuT3V0cHV0RGlyOiB0cnVlLFxuICAgICAgbmFtZTogJ0FzcGVjdEpTJyxcbiAgICAgIHJlYWRtZTogam9pbihfX2Rpcm5hbWUsICdSRUFETUUudHlwZWRvYy5tZCcpLFxuICAgICAgZXhjbHVkZUludGVybmFsOiB0cnVlLFxuICAgICAgZXhjbHVkZVByaXZhdGU6IHRydWUsXG4gICAgICBleGNsdWRlRXh0ZXJuYWxzOiB0cnVlLFxuICAgICAgZ3JvdXBPcmRlcjogWydNb2R1bGVzJywgJ1ZhcmlhYmxlcycsICdGdW5jdGlvbnMnLCAnKiddLFxuXG4gICAgICAvLyBjYXRlZ29yaXplQnlHcm91cDogZmFsc2UsXG4gICAgICAvLyBuYXZpZ2F0aW9uOiB7XG4gICAgICAvLyAgIGluY2x1ZGVDYXRlZ29yaWVzOiBmYWxzZSxcbiAgICAgIC8vICAgaW5jbHVkZUdyb3VwczogZmFsc2UsXG4gICAgICAvLyB9LFxuICAgICAgLy8gUGx1Z2luIG9wdGlvbnNcbiAgICAgIG91dDogJ2FwaScsXG4gICAgICBzaWRlYmFyOiB7XG4gICAgICAgIC8vIGZ1bGxOYW1lczogdHJ1ZSxcbiAgICAgICAgcGFyZW50Q2F0ZWdvcnk6ICdBUEknLFxuICAgICAgfSxcbiAgICB9KSguLi5hcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgLi4ucGx1Z2luLFxuICAgICAgb25XYXRjaGVkOiAoYXBwLCB3YXRjaGVycywgcmVsb2FkKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhZ2VzV2F0Y2hlciA9IGNob2tpZGFyLndhdGNoKFxuICAgICAgICAgIGVudHJ5UG9pbnRzLm1hcCgoZSkgPT4gZGlybmFtZShlKSkubWFwKChlKSA9PiBqb2luKGUsICcqKi8qLnRzJykpLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGN3ZDogYXBwLmRpci5zb3VyY2UoKSxcbiAgICAgICAgICAgIGlnbm9yZUluaXRpYWw6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgICAgcGFnZXNXYXRjaGVyLm9uKCdhZGQnLCBhc3luYyAoZmlsZVBhdGhSZWxhdGl2ZSkgPT4ge1xuICAgICAgICAgIHJlbG9hZCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcGFnZXNXYXRjaGVyLm9uKCdjaGFuZ2UnLCBhc3luYyAoZmlsZVBhdGhSZWxhdGl2ZSkgPT4ge1xuICAgICAgICAgIHJlbG9hZCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcGFnZXNXYXRjaGVyLm9uKCd1bmxpbmsnLCBhc3luYyAoZmlsZVBhdGhSZWxhdGl2ZSkgPT4ge1xuICAgICAgICAgIHJlbG9hZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB3YXRjaGVycy5wdXNoKHBhZ2VzV2F0Y2hlcik7XG4gICAgICB9LFxuICAgIH0gc2F0aXNmaWVzIFBsdWdpbk9iamVjdDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZmluZEVudHJ5cG9pbnRzKCkge1xuICBjb25zdCBfX2Rpcm5hbWUgPSB1cmwuZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuJywgaW1wb3J0Lm1ldGEudXJsKSk7XG4gIGNvbnN0IHJvb3RQYWNrYWdlUGF0aCA9IGZpbmRVcFN5bmMoJ3BhY2thZ2UuanNvbicsIHtcbiAgICBjd2Q6IGpvaW4oZGlybmFtZShmaW5kVXBTeW5jKCdwYWNrYWdlLmpzb24nLCB7IGN3ZDogX19kaXJuYW1lIH0pISksICcuLicpLFxuICB9KTtcblxuICBpZiAoIXJvb3RQYWNrYWdlUGF0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGZpbmQgcGFja2FnZS5qc29uJyk7XG4gIH1cblxuICBjb25zdCBwYWNrYWdlSnNvbiA9IHBhcnNlKHJlYWRGaWxlU3luYyhyb290UGFja2FnZVBhdGgsICd1dGYtOCcpKTtcbiAgY29uc3Qgd29ya3NwYWNlRGlyID0gZGlybmFtZShyb290UGFja2FnZVBhdGgpO1xuXG4gIGNvbnN0IHBhY2thZ2VKc29ucyA9IChwYWNrYWdlSnNvbi53b3Jrc3BhY2VzID8/IFtdKVxuICAgIC5tYXAoKHApID0+IGpvaW4od29ya3NwYWNlRGlyLCBwKSlcbiAgICAuY29uY2F0KGpvaW4od29ya3NwYWNlRGlyLCAnKicpKVxuICAgIC5mbGF0TWFwKChkKSA9PiBnbG9iU3luYyhqb2luKGQsICdwYWNrYWdlLmpzb24nKSkpO1xuXG4gIGNvbnN0IGVudHJ5cG9pbnRQYXR0ZXJuID0gJ2luZGV4LnRzJztcblxuICByZXR1cm4gcGFja2FnZUpzb25zXG4gICAgLm1hcCgoZCkgPT4gZGlybmFtZShkKSlcbiAgICAuZmxhdE1hcCgoZCkgPT4gZ2xvYlN5bmMoam9pbihkLCBlbnRyeXBvaW50UGF0dGVybikpKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFYsU0FBUyx3QkFBd0I7OztBQ0F4QixJQUFNLFVBQVU7QUFBQSxFQUNuWCxLQUFLO0FBQUEsSUFDSCxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxhQUFhO0FBQUEsRUFDZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFNRjs7O0FDVkEsU0FBUyxpQkFBaUI7OztBQ0MxQixTQUFTLFFBQUFBLGFBQVk7QUFDckIsU0FBUyxjQUFjOzs7QUNINFUsU0FBUyxZQUFZLGNBQWMsbUJBQW1CO0FBQ3paLFNBQVMsWUFBWTtBQUNyQixTQUFTLHNCQUFzQjs7O0FDRjJULFNBQVMsU0FBUyxZQUFZO0FBQ3hYLFNBQVMscUJBQXFCO0FBRDRMLElBQU0sMkNBQTJDO0FBR3BRLElBQU0sV0FBVyxLQUFLLGNBQWMsUUFBUSx3Q0FBZSxDQUFDLEdBQUcsSUFBSTs7O0FER25FLFNBQVMsV0FBVyxPQUFPLEtBQUs7QUFDckMsU0FBTyxZQUFZLEtBQUssS0FBSyxVQUFVLElBQUksR0FBRztBQUFBLElBQzVDLGVBQWU7QUFBQSxFQUNqQixDQUFDLEVBQ0UsT0FBTyxDQUFDLFdBQVcsT0FBTyxZQUFZLENBQUMsRUFDdkMsSUFBSSxDQUFDLFdBQVcsT0FBTyxJQUFJLEVBQzNCLE9BQU8sQ0FBQyxNQUFNLFlBQVksS0FBSyxLQUFLLE1BQU0sQ0FBQyxHQUFHLEtBQUssRUFBRSxNQUFNO0FBQ2hFO0FBRU8sU0FBUyxZQUFZLEtBQWEsV0FBVyxhQUFhO0FBQy9ELFFBQU0sT0FBTyxLQUFLLEtBQUssVUFBVSxLQUFLLFFBQVE7QUFDOUMsU0FBTyxXQUFXLElBQUksSUFBSSxLQUFLLFNBQVMsVUFBVSxJQUFJLElBQUk7QUFDNUQ7QUFFTyxTQUFTLFlBQVksVUFBa0I7QUFwQjlDO0FBcUJFLE1BQUksTUFBVyxDQUFDO0FBRWhCLGlCQUFlO0FBQUEsSUFDYixTQUFTO0FBQUEsTUFDUCxPQUFPLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUFBLElBQ3BCO0FBQUEsRUFDRixDQUFDLEVBQUUsT0FBTyxhQUFhLEtBQUssS0FBSyxVQUFVLFFBQVEsQ0FBQyxFQUFFLFNBQVMsR0FBRyxHQUFHO0FBRXJFLFFBQU0sVUFDSixTQUFJLFFBQVEsS0FBSyxDQUFDLElBQVMsT0FBWSxHQUFHLFFBQVEsR0FBRyxLQUFLLEVBQUUsQ0FBQyxNQUE3RCxtQkFBZ0UsVUFDaEU7QUFFRixRQUFNLFNBQU8sU0FBSSxnQkFBSixtQkFBaUIsU0FBUTtBQUN0QyxTQUFPLEVBQUUsT0FBTyxLQUFLO0FBQ3ZCO0FBRU8sU0FBUyxZQUFZQyxVQUFpQixnQkFBZ0IsTUFBTTtBQUNqRSxRQUFNLE1BQU0sS0FBSyxLQUFLLFVBQVVBLFFBQU87QUFDdkMsU0FBTyxZQUFZLEtBQUssRUFBRSxlQUFlLEtBQUssQ0FBQyxFQUM1QyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sS0FBSyxFQUFFLEtBQUssU0FBUyxLQUFLLENBQUMsRUFDbEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQ2pCLE9BQU8sQ0FBQyxhQUFxQixDQUFDLEtBQUssU0FBUyxRQUFRLEVBQUUsV0FBVyxHQUFHLENBQUMsRUFDckUsT0FBTyxDQUFDLE1BQU07QUFDYixRQUFJLENBQUMsZUFBZTtBQUNsQixhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sTUFBTSxDQUFDO0FBQ2IsbUJBQWUsQ0FBQyxDQUFDLEVBQUU7QUFBQSxNQUNqQixhQUFhLEtBQUssS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFLFNBQVM7QUFBQSxNQUN6QztBQUFBLElBQ0Y7QUFDQSxXQUFPLElBQUksWUFBWSxVQUFVO0FBQUEsRUFDbkMsQ0FBQyxFQUNBO0FBQUEsSUFBSyxDQUFDLElBQUksT0FDVCxHQUFHLGNBQWMsSUFBSSxNQUFNO0FBQUEsTUFDekIsU0FBUztBQUFBLE1BQ1QsbUJBQW1CO0FBQUEsSUFDckIsQ0FBQztBQUFBLEVBQ0g7QUFDSjs7O0FEckRBLFNBQVMsWUFBWSxLQUFhO0FBQ2hDLFFBQU0sS0FBSyxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBRTdCLE1BQUksSUFBSTtBQUNOLFdBQU87QUFBQSxFQUNUO0FBRUEsU0FBTyxXQUFXLEdBQUcsRUFBRTtBQUFBLElBQUksQ0FBQyxNQUMxQkMsTUFBSyxLQUFLLEdBQUcsWUFBWUEsTUFBSyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFBQSxFQUM3QyxFQUFFLENBQUM7QUFDTDtBQUVPLFNBQVMsYUFBYSxlQUFlLEtBQUs7QUFDL0MsUUFBTSxjQUFjLE9BQU8sS0FBSyxPQUFPLEVBQ3BDLE9BQU8sQ0FBQyxNQUFNLE1BQU0sWUFBWSxFQUNoQyxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQVcsS0FBSyxFQUFFLENBQUM7QUFFbkMsUUFBTSxPQUFPLFdBQVcsWUFBWSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsWUFBWSxTQUFTLENBQUMsQ0FBQztBQUU1RSxTQUFPLE9BQU87QUFBQSxJQUNaO0FBQUEsSUFDQSxHQUFHLEtBQ0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFDOUIsT0FBTyxDQUFDLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFDakMsSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU07QUFDckIsWUFBTSxLQUFLLFlBQVksR0FBYTtBQUVwQyxPQUFDLENBQUM7QUFDRixZQUFNLEVBQUUsTUFBTSxNQUFNLElBQUksWUFBWSxLQUFlO0FBQ25ELGFBQU87QUFBQSxRQUNMLE1BQU07QUFBQSxRQUNOLE1BQU0sR0FBRyxlQUFlLE9BQU87QUFBQSxRQUMvQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNMLENBQUM7QUFDSDs7O0FHM0MrWCxPQUFPLGNBQWM7QUFHcFosU0FBUyxjQUFjLEtBQVU7QUFDL0I7QUFDRjtBQUNPLElBQU0sZUFBcUMsTUFBTTtBQUN0RCxTQUFPLENBQUMsUUFBUTtBQUNkLFdBQU87QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOLGVBQWUsQ0FBQ0MsU0FBUTtBQUFBLE1BR3hCO0FBQUEsTUFDQSxRQUFRLENBQUNBLFNBQVE7QUFBQSxNQUFDO0FBQUEsTUFFbEIsV0FBVyxDQUFDQSxNQUFLLFVBQVUsV0FBVztBQUNwQyxjQUFNLGVBQWUsU0FBUyxNQUFNQSxLQUFJLFFBQVEsY0FBYztBQUFBLFVBQzVELEtBQUtBLEtBQUksSUFBSSxPQUFPO0FBQUEsVUFDcEIsZUFBZTtBQUFBLFFBQ2pCLENBQUM7QUFDRCxxQkFBYSxHQUFHLE9BQU8sT0FBTyxxQkFBcUI7QUFDakQsaUJBQU87QUFBQSxRQUVULENBQUM7QUFLRCxxQkFBYSxHQUFHLFVBQVUsT0FBTyxxQkFBcUI7QUFDcEQsaUJBQU87QUFDUCx3QkFBY0EsSUFBRztBQUFBLFFBQ25CLENBQUM7QUFFRCxpQkFBUyxLQUFLLFlBQVk7QUFBQSxNQUM1QjtBQUFBLE1BRUEsYUFBYSxDQUFDLFNBQVM7QUFBQSxNQUFDO0FBQUEsSUFDMUI7QUFBQSxFQUNGO0FBQ0Y7OztBQ3hDc1gsU0FBUyxRQUFBQyxhQUFZO0FBQzNZLFNBQVMsaUJBQWlCO0FBQzFCO0FBQUEsRUFDRTtBQUFBLE9BSUs7OztBQ0xBLFNBQVMsY0FDZCxPQUNBLE9BQ0E7QUFMRjtBQU1FLE1BQUksTUFBTSxhQUFhLGFBQWE7QUFDbEMsV0FBTztBQUFBLEVBQ1Q7QUFDQSxRQUFNLEtBQUs7QUFFWCxNQUFJLE1BQU0sU0FBUyxVQUFVLE1BQU0sU0FBUyxPQUFPO0FBQ2pELFdBQU87QUFBQSxFQUNULFdBQVcsTUFBTSxTQUFTLFNBQVMsTUFBTSxTQUFTLFFBQVE7QUFDeEQsV0FBTztBQUFBLEVBQ1Q7QUFDQSxRQUFNLFNBQ0osTUFBTSxXQUNMLGtCQUFNLFlBQVksTUFBTSxTQUFTLE1BQU0sRUFBRSxNQUF6QyxtQkFBNEMsV0FBNUMsbUJBQW9ELFVBQ3JEO0FBRUYsUUFBTSxTQUNKLE1BQU0sV0FDTCxrQkFBTSxZQUFZLE1BQU0sU0FBUyxNQUFNLEVBQUUsTUFBekMsbUJBQTRDLFdBQTVDLG1CQUFvRCxVQUNyRDtBQUVGLE1BQUksV0FBVyxRQUFRO0FBQ3JCLFlBQVEsTUFBTSxZQUFZLE1BQU0sU0FBUztBQUFBLE1BQ3ZDLE1BQU0sWUFBWSxNQUFNO0FBQUEsTUFDeEI7QUFBQSxNQUNBO0FBQUEsUUFDRSxTQUFTO0FBQUEsUUFDVCxtQkFBbUI7QUFBQSxNQUNyQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0EsU0FBTyxDQUFDLFNBQVMsQ0FBQztBQUNwQjs7O0FEeEJBLElBQU0sK0JBQStCO0FBRXJDLFNBQVMsa0JBQWtCLEtBQTBCO0FBQ25ELFFBQU0sV0FBMEIsWUFBWSxHQUFHLEVBUTVDLElBQUksQ0FBQyxhQUFhO0FBQ2pCLFVBQU0sV0FBV0MsTUFBSyxLQUFLLEtBQUssUUFBUTtBQUN4QyxXQUFPLENBQUMsVUFBVSxVQUFVLFFBQVE7QUFBQSxFQUN0QyxDQUFDLEVBQ0E7QUFBQSxJQUNDLFdBQVcsR0FBRyxFQUFFLElBQUksQ0FBQyxhQUFhO0FBQ2hDLFlBQU0sV0FBV0EsTUFBSyxLQUFLLEtBQUssUUFBUTtBQUN4QyxhQUFPLENBQUMsVUFBVSxVQUFVLGtCQUFrQixRQUFRLENBQUM7QUFBQSxJQUN6RCxDQUFDO0FBQUEsRUFDSCxFQUNDLEtBQUssQ0FBQyxDQUFDLFdBQVcsU0FBUyxHQUFHLENBQUMsV0FBVyxTQUFTLE1BQU07QUFDeEQsV0FBTztBQUFBLE1BQ0w7QUFBQSxRQUNFLFVBQVU7QUFBQSxRQUNWLE1BQU0sVUFBVUEsTUFBSyxLQUFLLFVBQVUsU0FBUyxDQUFDLEVBQUUsWUFBWSxJQUN4RCxRQUNBO0FBQUEsTUFDTjtBQUFBLE1BQ0E7QUFBQSxRQUNFLFVBQVU7QUFBQSxRQUNWLE1BQU0sVUFBVUEsTUFBSyxLQUFLLFVBQVUsU0FBUyxDQUFDLEVBQUUsWUFBWSxJQUN4RCxRQUNBO0FBQUEsTUFDTjtBQUFBLElBQ0Y7QUFBQSxFQUNGLENBQUMsRUFDQSxJQUFJLENBQUMsQ0FBQyxXQUFXLFdBQVcsTUFBTSxNQUFNLE1BQU07QUFFakQsUUFBTSxVQUFVLFlBQVksR0FBRztBQUMvQixRQUFNLFdBQVdBLE1BQUssU0FBUyxHQUFHO0FBQ2xDLFFBQU0sRUFBRSxNQUFNLE1BQU0sSUFBSSxVQUNwQixZQUFZLE9BQU8sSUFDbkI7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLE9BQU8sR0FBRyxTQUFTLE9BQU8sQ0FBQyxFQUFFLFlBQVksSUFBSSxTQUFTLE1BQU0sQ0FBQztBQUFBLEVBQy9EO0FBRUosU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ047QUFBQSxJQUNBO0FBQUEsSUFDQSxjQUFhLHFDQUFVLFVBQVM7QUFBQSxFQUNsQztBQUNGO0FBQ08sU0FBUyxjQUFjLGVBQWUsS0FBSztBQUNoRCxVQUFRLElBQUksZUFBZTtBQUMzQixRQUFNLGNBQWMsT0FBTyxLQUFLLE9BQU8sRUFDcEMsT0FBTyxDQUFDLE1BQU0sTUFBTSxZQUFZLEVBQ2hDLElBQUksQ0FBQyxNQUFNLEVBQUUsV0FBVyxLQUFLLEVBQUUsQ0FBQztBQUVuQyxRQUFNLE9BQU8sV0FBVyxZQUFZLEVBQ2pDLE9BQU8sQ0FBQyxNQUFNLENBQUMsWUFBWSxTQUFTLENBQUMsQ0FBQyxFQUN0QyxJQUFJLENBQUMsTUFBTUEsTUFBSyxLQUFLLGNBQWMsQ0FBQyxDQUFDO0FBRXhDLFNBQU87QUFBQSxJQUNMLEtBQUssT0FBTyxDQUFDLFNBQWMsUUFBUTtBQS9FdkM7QUFnRk0sWUFBTSxTQUEyQixrQkFBa0IsR0FBRztBQUN0RCxhQUFPO0FBQ1AsYUFBTztBQUFBLFFBQ0wsR0FBRztBQUFBLFFBQ0gsQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLE1BQU07QUFBQSxRQUNwQixlQUFhLFlBQU8sYUFBUCxtQkFBaUIsVUFBUztBQUFBLE1BQ3pDO0FBQUEsSUFDRixHQUFHLENBQUMsQ0FBMEI7QUFBQSxFQUNoQztBQUNGOzs7QUxuRkEsU0FBUyx1QkFBdUI7OztBT05vVyxPQUFPQyxlQUFjO0FBQ3paLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsZ0JBQUFDLHFCQUFvQjtBQUM3QixTQUFTLGdCQUFnQjtBQUN6QixPQUFPLFdBQVc7QUFDbEIsU0FBUyxXQUFBQyxVQUFTLFFBQUFDLGFBQVk7QUFDOUIsWUFBWSxTQUFTO0FBRXJCLFNBQVMscUJBQXFCO0FBUjlCLElBQU0sbUNBQW1DO0FBQTBNLElBQU1DLDRDQUEyQztBQVNwUyxJQUFNLEVBQUUsTUFBTSxJQUFJO0FBQ1gsU0FBUyxzQkFBc0M7QUFDcEQsUUFBTSxjQUFjLGdCQUFnQjtBQUVwQyxTQUFPLElBQUksU0FBUztBQUNsQixVQUFNLFNBQVMsY0FBYztBQUFBO0FBQUEsTUFFM0I7QUFBQSxNQUNBLFVBQVUsR0FBRztBQUFBLE1BQ2IsZ0JBQWdCO0FBQUEsTUFDaEIsTUFBTTtBQUFBLE1BQ04sUUFBUUMsTUFBSyxrQ0FBVyxtQkFBbUI7QUFBQSxNQUMzQyxpQkFBaUI7QUFBQSxNQUNqQixnQkFBZ0I7QUFBQSxNQUNoQixrQkFBa0I7QUFBQSxNQUNsQixZQUFZLENBQUMsV0FBVyxhQUFhLGFBQWEsR0FBRztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BUXJELEtBQUs7QUFBQSxNQUNMLFNBQVM7QUFBQTtBQUFBLFFBRVAsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGLENBQUMsRUFBRSxHQUFHLElBQUk7QUFDVixXQUFPO0FBQUEsTUFDTCxHQUFHO0FBQUEsTUFDSCxXQUFXLENBQUMsS0FBSyxVQUFVLFdBQVc7QUFDcEMsY0FBTSxlQUFlQyxVQUFTO0FBQUEsVUFDNUIsWUFBWSxJQUFJLENBQUMsTUFBTUMsU0FBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTUYsTUFBSyxHQUFHLFNBQVMsQ0FBQztBQUFBLFVBQ2hFO0FBQUEsWUFDRSxLQUFLLElBQUksSUFBSSxPQUFPO0FBQUEsWUFDcEIsZUFBZTtBQUFBLFVBQ2pCO0FBQUEsUUFDRjtBQUNBLHFCQUFhLEdBQUcsT0FBTyxPQUFPLHFCQUFxQjtBQUNqRCxpQkFBTztBQUFBLFFBQ1QsQ0FBQztBQUNELHFCQUFhLEdBQUcsVUFBVSxPQUFPLHFCQUFxQjtBQUNwRCxpQkFBTztBQUFBLFFBQ1QsQ0FBQztBQUNELHFCQUFhLEdBQUcsVUFBVSxPQUFPLHFCQUFxQjtBQUNwRCxpQkFBTztBQUFBLFFBQ1QsQ0FBQztBQUVELGlCQUFTLEtBQUssWUFBWTtBQUFBLE1BQzVCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjtBQUVBLFNBQVMsa0JBQWtCO0FBQ3pCLFFBQU1HLGFBQWdCLGtCQUFjLElBQUksSUFBSSxLQUFLSix5Q0FBZSxDQUFDO0FBQ2pFLFFBQU0sa0JBQWtCLFdBQVcsZ0JBQWdCO0FBQUEsSUFDakQsS0FBS0MsTUFBS0UsU0FBUSxXQUFXLGdCQUFnQixFQUFFLEtBQUtDLFdBQVUsQ0FBQyxDQUFFLEdBQUcsSUFBSTtBQUFBLEVBQzFFLENBQUM7QUFFRCxNQUFJLENBQUMsaUJBQWlCO0FBQ3BCLFVBQU0sSUFBSSxNQUFNLDZCQUE2QjtBQUFBLEVBQy9DO0FBRUEsUUFBTSxjQUFjLE1BQU1DLGNBQWEsaUJBQWlCLE9BQU8sQ0FBQztBQUNoRSxRQUFNLGVBQWVGLFNBQVEsZUFBZTtBQUU1QyxRQUFNLGdCQUFnQixZQUFZLGNBQWMsQ0FBQyxHQUM5QyxJQUFJLENBQUMsTUFBTUYsTUFBSyxjQUFjLENBQUMsQ0FBQyxFQUNoQyxPQUFPQSxNQUFLLGNBQWMsR0FBRyxDQUFDLEVBQzlCLFFBQVEsQ0FBQyxNQUFNLFNBQVNBLE1BQUssR0FBRyxjQUFjLENBQUMsQ0FBQztBQUVuRCxRQUFNLG9CQUFvQjtBQUUxQixTQUFPLGFBQ0osSUFBSSxDQUFDLE1BQU1FLFNBQVEsQ0FBQyxDQUFDLEVBQ3JCLFFBQVEsQ0FBQyxNQUFNLFNBQVNGLE1BQUssR0FBRyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3hEOzs7QVA3RWUsU0FBUixjQUFzQztBQUMzQyxRQUFNLFVBQXdCO0FBQUEsSUFDNUIsYUFBYTtBQUFBLElBQ2Isb0JBQW9CO0FBQUEsSUFDcEIsZ0JBQWdCO0FBQUEsTUFDZCxjQUFjO0FBQUEsTUFDZCxjQUFjO0FBQUEsUUFDWjtBQUFBLFVBQ0UsUUFBUSxDQUFDLFNBQWUsS0FBSyxZQUFZO0FBQUEsVUFDekMsV0FBVztBQUFBLFFBQ2I7QUFBQSxRQUNBO0FBQUEsVUFDRSxRQUFRLENBQUMsU0FBZSxLQUFLLFlBQVk7QUFBQSxVQUN6QyxXQUFXO0FBQUEsUUFDYjtBQUFBLE1BQ0Y7QUFBQTtBQUFBLElBRUYsQ0FBQztBQUFBLEVBQ0g7QUFFQSxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTjtBQUFBLElBQ0EsU0FBUyxVQUFVO0FBQUEsTUFDakIsVUFBVTtBQUFBLE1BQ1Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLE1BQU07QUFBQTtBQUFBLE1BRVI7QUFBQSxNQUVBLFlBQVk7QUFBQSxNQUVaLE1BQU07QUFBQSxNQUVOLE1BQU07QUFBQSxNQUVOLFNBQVM7QUFBQSxNQUVULFNBQVM7QUFBQSxRQUNQLEtBQUs7QUFBQTtBQUFBLFVBRUgsUUFBUSxhQUFhLEdBQUc7QUFBQTtBQUFBLFVBRXhCLFNBQVMsY0FBYyxHQUFHO0FBQUEsVUFDMUIsZUFBZTtBQUFBLFVBRWYsYUFBYTtBQUFBLFlBQ1gsVUFBVTtBQUFBLFVBQ1o7QUFBQSxRQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BYUY7QUFBQSxNQUVBLFNBQVM7QUFBQTtBQUFBLFFBRVAsV0FBVztBQUFBLFVBQ1QsT0FBTztBQUFBLFVBQ1AsT0FBTztBQUFBLFVBQ1AsT0FBTztBQUFBLFVBQ1AsVUFBVTtBQUFBLFVBQ1YsTUFBTTtBQUFBLFVBQ04sU0FBUztBQUFBLFVBQ1QsUUFBUTtBQUFBLFVBQ1IsV0FBVztBQUFBLFVBQ1gsS0FBSztBQUFBLFVBQ0wsYUFBYTtBQUFBLFVBQ2IsU0FBUztBQUFBLFVBQ1QsU0FBUztBQUFBO0FBQUEsVUFFVCxNQUFNO0FBQUE7QUFBQSxVQUVOLFlBQVk7QUFBQSxZQUNWLFNBQVMsQ0FBQyxJQUFJO0FBQUEsVUFDaEI7QUFBQSxVQUNBLFNBQVM7QUFBQSxZQUNQO0FBQUEsY0FDRSxTQUFTO0FBQUEsY0FDVCxVQUFVLENBQUMsRUFBRSxJQUFJLE1BQU07QUFDckIsb0JBQUksUUFBUTtBQUNWLHlCQUFPO0FBQUEsb0JBQ0wsS0FBSztBQUFBLG9CQUNMLE9BQU8sRUFBRSxNQUFNLE1BQU07QUFBQSxvQkFDckIsU0FBUztBQUFBLGtCQUNYO0FBQUEsY0FDSjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsVUFDQSxLQUFLO0FBQUEsVUFDTCxLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsVUFDTixNQUFNO0FBQUEsVUFDTixlQUFlO0FBQUEsUUFDakI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUEwREY7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0Y7OztBRjNLQTtBQUNBLElBQU8saUJBQVEsaUJBQWlCO0FBQUEsRUFDOUIsTUFBTTtBQUFBLEVBRU4sU0FBUztBQUFBLEVBRVQ7QUFBQTtBQUFBO0FBSUYsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCIsICJkaXJuYW1lIiwgInBhdGgiLCAiYXBwIiwgInBhdGgiLCAicGF0aCIsICJjaG9raWRhciIsICJyZWFkRmlsZVN5bmMiLCAiZGlybmFtZSIsICJqb2luIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwiLCAiam9pbiIsICJjaG9raWRhciIsICJkaXJuYW1lIiwgIl9fZGlybmFtZSIsICJyZWFkRmlsZVN5bmMiXQp9Cg==
