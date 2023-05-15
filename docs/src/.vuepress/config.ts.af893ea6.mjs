// src/.vuepress/config.ts
import { defineUserConfig } from "vuepress";

// src/.vuepress/locales.ts
var LOCALES = {
  "/": {
    lang: "en-US",
    title: "AspectJS documentation",
    description: "Documentation for the AspectJS framework"
  },
  "/fr/": {
    lang: "fr-FR",
    title: "AspectJS documentation",
    description: "Documentation for the AspectJS framework"
  }
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
var __vite_injected_original_import_meta_url = "file:///home/nicolas/projects/aspectjs-next/docs/src/.vuepress/utils.ts";
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
function listMdFiles(dirname2, filterIgnored = true) {
  const dir = path.join(ROOT_DIR, dirname2);
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
      debugger;
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

// src/.vuepress/sidebar/sidebar.ts
import { path as path3 } from "@vuepress/utils";
import { sidebar } from "vuepress-theme-hope";
function buildSidebarItems(dir) {
  const children = listMdDirs(dir).map((d) => path3.join(dir, d)).map((d) => {
    return buildSidebarItems(d);
  }).concat(listMdFiles(dir).map((d) => path3.join(dir, d)));
  const mdIndex = findIndexMd(dir);
  const { icon, title } = mdIndex ? extractInfo(mdIndex) : { icon: "", title: dir };
  return {
    text: title,
    icon,
    children
  };
}
function createSidebar(localePrefix = "/") {
  const localesDirs = Object.keys(LOCALES).filter((l) => l !== localePrefix).map((l) => l.replaceAll("/", ""));
  const dirs = listMdDirs(localePrefix).filter((d) => !localesDirs.includes(d)).map((d) => path3.join(localePrefix, d));
  return sidebar(
    dirs.reduce((config, dir) => {
      return {
        ...config,
        [`${dir}/`]: [buildSidebarItems(dir)]
      };
    }, {})
  );
}

// src/.vuepress/theme.ts
var theme_default = hopeTheme({
  hostname: "https://vuepress-theme-hope-docs-demo.netlify.app",
  sidebarSorter: (infoA, infoB) => {
    var _a, _b, _c, _d;
    const rx = /^(?<order>\d+).*$/;
    const orderA = infoA.order ?? ((_b = (_a = (infoA.filename ?? infoA.dirname).match(rx)) == null ? void 0 : _a.groups) == null ? void 0 : _b.order) ?? Infinity;
    const orderB = infoB.order ?? ((_d = (_c = (infoB.filename ?? infoB.dirname).match(rx)) == null ? void 0 : _c.groups) == null ? void 0 : _d.order) ?? Infinity;
    return +orderA - +orderB;
  },
  author: {
    name: "Mr.Hope",
    url: "https://mrhope.site"
  },
  iconAssets: "fontawesome-with-brands",
  logo: "/logo.svg",
  repo: "vuepress-theme-hope/vuepress-theme-hope",
  docsDir: "demo/theme-docs/src",
  locales: {
    "/": {
      // navbar
      navbar: createNavbar("/"),
      // sidebar
      sidebar: createSidebar("/"),
      // footer: "Default footer",
      displayFooter: true,
      metaLocales: {
        editLink: "Edit this page on GitHub"
      }
    },
    /**
     * Chinese locale config
     */
    "/fr/": {
      // navbar
      navbar: createNavbar("/fr/"),
      // sidebar
      sidebar: createSidebar("/fr/"),
      displayFooter: true,
      // page meta
      metaLocales: {
        editLink: "Editer sur GitHub"
      }
    }
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
});

// src/.vuepress/config.ts
var config_default = defineUserConfig({
  base: "/",
  locales: LOCALES,
  theme: theme_default
  // Enable it with pwa
  // shouldPrefetch: false,
});
export {
  config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjLy52dWVwcmVzcy9jb25maWcudHMiLCAic3JjLy52dWVwcmVzcy9sb2NhbGVzLnRzIiwgInNyYy8udnVlcHJlc3MvdGhlbWUudHMiLCAic3JjLy52dWVwcmVzcy9uYXZiYXIvbmF2YmFyLnRzIiwgInNyYy8udnVlcHJlc3MvbWQvdXRpbHMudHMiLCAic3JjLy52dWVwcmVzcy91dGlscy50cyIsICJzcmMvLnZ1ZXByZXNzL3NpZGViYXIvc2lkZWJhci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMtbmV4dC9kb2NzL3NyYy8udnVlcHJlc3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMtbmV4dC9kb2NzL3NyYy8udnVlcHJlc3MvY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMtbmV4dC9kb2NzL3NyYy8udnVlcHJlc3MvY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lVXNlckNvbmZpZyB9IGZyb20gJ3Z1ZXByZXNzJztcbmltcG9ydCB7IExPQ0FMRVMgfSBmcm9tICcuL2xvY2FsZXMnO1xuaW1wb3J0IHRoZW1lIGZyb20gJy4vdGhlbWUuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVVc2VyQ29uZmlnKHtcbiAgYmFzZTogJy8nLFxuXG4gIGxvY2FsZXM6IExPQ0FMRVMsXG5cbiAgdGhlbWUsXG5cbiAgLy8gRW5hYmxlIGl0IHdpdGggcHdhXG4gIC8vIHNob3VsZFByZWZldGNoOiBmYWxzZSxcbn0pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzLW5leHQvZG9jcy9zcmMvLnZ1ZXByZXNzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzLW5leHQvZG9jcy9zcmMvLnZ1ZXByZXNzL2xvY2FsZXMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3Rqcy1uZXh0L2RvY3Mvc3JjLy52dWVwcmVzcy9sb2NhbGVzLnRzXCI7ZXhwb3J0IGNvbnN0IExPQ0FMRVMgPSB7XG4gICcvJzoge1xuICAgIGxhbmc6ICdlbi1VUycsXG4gICAgdGl0bGU6ICdBc3BlY3RKUyBkb2N1bWVudGF0aW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ0RvY3VtZW50YXRpb24gZm9yIHRoZSBBc3BlY3RKUyBmcmFtZXdvcmsnLFxuICB9LFxuICAnL2ZyLyc6IHtcbiAgICBsYW5nOiAnZnItRlInLFxuICAgIHRpdGxlOiAnQXNwZWN0SlMgZG9jdW1lbnRhdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdEb2N1bWVudGF0aW9uIGZvciB0aGUgQXNwZWN0SlMgZnJhbWV3b3JrJyxcbiAgfSxcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMtbmV4dC9kb2NzL3NyYy8udnVlcHJlc3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMtbmV4dC9kb2NzL3NyYy8udnVlcHJlc3MvdGhlbWUudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3Rqcy1uZXh0L2RvY3Mvc3JjLy52dWVwcmVzcy90aGVtZS50c1wiO2ltcG9ydCB7IGhvcGVUaGVtZSwgU2lkZWJhckluZm8gfSBmcm9tICd2dWVwcmVzcy10aGVtZS1ob3BlJztcbmltcG9ydCB7IGNyZWF0ZU5hdmJhciB9IGZyb20gJy4vbmF2YmFyL25hdmJhcic7XG5pbXBvcnQgeyBjcmVhdGVTaWRlYmFyIH0gZnJvbSAnLi9zaWRlYmFyL3NpZGViYXInO1xuXG5leHBvcnQgZGVmYXVsdCBob3BlVGhlbWUoe1xuICBob3N0bmFtZTogJ2h0dHBzOi8vdnVlcHJlc3MtdGhlbWUtaG9wZS1kb2NzLWRlbW8ubmV0bGlmeS5hcHAnLFxuICBzaWRlYmFyU29ydGVyOiAoaW5mb0E6IFNpZGViYXJJbmZvIHwgYW55LCBpbmZvQjogU2lkZWJhckluZm8gfCBhbnkpID0+IHtcbiAgICBjb25zdCByeCA9IC9eKD88b3JkZXI+XFxkKykuKiQvO1xuXG4gICAgY29uc3Qgb3JkZXJBID1cbiAgICAgIGluZm9BLm9yZGVyID8/XG4gICAgICAoaW5mb0EuZmlsZW5hbWUgPz8gaW5mb0EuZGlybmFtZSkubWF0Y2gocngpPy5ncm91cHM/Lm9yZGVyID8/XG4gICAgICBJbmZpbml0eTtcblxuICAgIGNvbnN0IG9yZGVyQiA9XG4gICAgICBpbmZvQi5vcmRlciA/P1xuICAgICAgKGluZm9CLmZpbGVuYW1lID8/IGluZm9CLmRpcm5hbWUpLm1hdGNoKHJ4KT8uZ3JvdXBzPy5vcmRlciA/P1xuICAgICAgSW5maW5pdHk7XG5cbiAgICByZXR1cm4gK29yZGVyQSAtICtvcmRlckI7XG4gIH0sXG4gIGF1dGhvcjoge1xuICAgIG5hbWU6ICdNci5Ib3BlJyxcbiAgICB1cmw6ICdodHRwczovL21yaG9wZS5zaXRlJyxcbiAgfSxcblxuICBpY29uQXNzZXRzOiAnZm9udGF3ZXNvbWUtd2l0aC1icmFuZHMnLFxuXG4gIGxvZ286ICcvbG9nby5zdmcnLFxuXG4gIHJlcG86ICd2dWVwcmVzcy10aGVtZS1ob3BlL3Z1ZXByZXNzLXRoZW1lLWhvcGUnLFxuXG4gIGRvY3NEaXI6ICdkZW1vL3RoZW1lLWRvY3Mvc3JjJyxcblxuICBsb2NhbGVzOiB7XG4gICAgJy8nOiB7XG4gICAgICAvLyBuYXZiYXJcbiAgICAgIG5hdmJhcjogY3JlYXRlTmF2YmFyKCcvJyksXG5cbiAgICAgIC8vIHNpZGViYXJcbiAgICAgIHNpZGViYXI6IGNyZWF0ZVNpZGViYXIoJy8nKSxcblxuICAgICAgLy8gZm9vdGVyOiBcIkRlZmF1bHQgZm9vdGVyXCIsXG5cbiAgICAgIGRpc3BsYXlGb290ZXI6IHRydWUsXG5cbiAgICAgIG1ldGFMb2NhbGVzOiB7XG4gICAgICAgIGVkaXRMaW5rOiAnRWRpdCB0aGlzIHBhZ2Ugb24gR2l0SHViJyxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoaW5lc2UgbG9jYWxlIGNvbmZpZ1xuICAgICAqL1xuICAgICcvZnIvJzoge1xuICAgICAgLy8gbmF2YmFyXG4gICAgICBuYXZiYXI6IGNyZWF0ZU5hdmJhcignL2ZyLycpLFxuICAgICAgLy8gc2lkZWJhclxuICAgICAgc2lkZWJhcjogY3JlYXRlU2lkZWJhcignL2ZyLycpLFxuICAgICAgZGlzcGxheUZvb3RlcjogdHJ1ZSxcblxuICAgICAgLy8gcGFnZSBtZXRhXG4gICAgICBtZXRhTG9jYWxlczoge1xuICAgICAgICBlZGl0TGluazogJ0VkaXRlciBzdXIgR2l0SHViJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcblxuICBwbHVnaW5zOiB7XG4gICAgLy8gYWxsIGZlYXR1cmVzIGFyZSBlbmFibGVkIGZvciBkZW1vLCBvbmx5IHByZXNlcnZlIGZlYXR1cmVzIHlvdSBuZWVkIGhlcmVcbiAgICBtZEVuaGFuY2U6IHtcbiAgICAgIGFsaWduOiB0cnVlLFxuICAgICAgYXR0cnM6IHRydWUsXG4gICAgICBjaGFydDogdHJ1ZSxcbiAgICAgIGNvZGV0YWJzOiB0cnVlLFxuICAgICAgZGVtbzogdHJ1ZSxcbiAgICAgIGVjaGFydHM6IHRydWUsXG4gICAgICBmaWd1cmU6IHRydWUsXG4gICAgICBmbG93Y2hhcnQ6IHRydWUsXG4gICAgICBnZm06IHRydWUsXG4gICAgICBpbWdMYXp5bG9hZDogdHJ1ZSxcbiAgICAgIGltZ1NpemU6IHRydWUsXG4gICAgICBpbmNsdWRlOiB0cnVlLFxuICAgICAgLy8ga2F0ZXg6IHRydWUsXG4gICAgICBtYXJrOiB0cnVlLFxuICAgICAgLy8gbWVybWFpZDogdHJ1ZSxcbiAgICAgIHBsYXlncm91bmQ6IHtcbiAgICAgICAgcHJlc2V0czogWyd0cyddLFxuICAgICAgfSxcbiAgICAgIHN0eWxpemU6IFtcbiAgICAgICAge1xuICAgICAgICAgIG1hdGNoZXI6ICdSZWNvbW1lbmRlZCcsXG4gICAgICAgICAgcmVwbGFjZXI6ICh7IHRhZyB9KSA9PiB7XG4gICAgICAgICAgICBpZiAodGFnID09PSAnZW0nKVxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRhZzogJ0JhZGdlJyxcbiAgICAgICAgICAgICAgICBhdHRyczogeyB0eXBlOiAndGlwJyB9LFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdSZWNvbW1lbmRlZCcsXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBzdWI6IHRydWUsXG4gICAgICBzdXA6IHRydWUsXG4gICAgICB0YWJzOiB0cnVlLFxuICAgICAgdlByZTogdHJ1ZSxcbiAgICAgIHZ1ZVBsYXlncm91bmQ6IHRydWUsXG4gICAgfSxcblxuICAgIC8vIHVuY29tbWVudCB0aGVzZSBpZiB5b3Ugd2FudCBhIHB3YVxuICAgIC8vIHB3YToge1xuICAgIC8vICAgZmF2aWNvbjogXCIvZmF2aWNvbi5pY29cIixcbiAgICAvLyAgIGNhY2hlSFRNTDogdHJ1ZSxcbiAgICAvLyAgIGNhY2hlUGljOiB0cnVlLFxuICAgIC8vICAgYXBwZW5kQmFzZTogdHJ1ZSxcbiAgICAvLyAgIGFwcGxlOiB7XG4gICAgLy8gICAgIGljb246IFwiL2Fzc2V0cy9pY29uL2FwcGxlLWljb24tMTUyLnBuZ1wiLFxuICAgIC8vICAgICBzdGF0dXNCYXJDb2xvcjogXCJibGFja1wiLFxuICAgIC8vICAgfSxcbiAgICAvLyAgIG1zVGlsZToge1xuICAgIC8vICAgICBpbWFnZTogXCIvYXNzZXRzL2ljb24vbXMtaWNvbi0xNDQucG5nXCIsXG4gICAgLy8gICAgIGNvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAvLyAgIH0sXG4gICAgLy8gICBtYW5pZmVzdDoge1xuICAgIC8vICAgICBpY29uczogW1xuICAgIC8vICAgICAgIHtcbiAgICAvLyAgICAgICAgIHNyYzogXCIvYXNzZXRzL2ljb24vY2hyb21lLW1hc2stNTEyLnBuZ1wiLFxuICAgIC8vICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgIC8vICAgICAgICAgcHVycG9zZTogXCJtYXNrYWJsZVwiLFxuICAgIC8vICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAvLyAgICAgICB9LFxuICAgIC8vICAgICAgIHtcbiAgICAvLyAgICAgICAgIHNyYzogXCIvYXNzZXRzL2ljb24vY2hyb21lLW1hc2stMTkyLnBuZ1wiLFxuICAgIC8vICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgIC8vICAgICAgICAgcHVycG9zZTogXCJtYXNrYWJsZVwiLFxuICAgIC8vICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAvLyAgICAgICB9LFxuICAgIC8vICAgICAgIHtcbiAgICAvLyAgICAgICAgIHNyYzogXCIvYXNzZXRzL2ljb24vY2hyb21lLTUxMi5wbmdcIixcbiAgICAvLyAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcbiAgICAvLyAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgLy8gICAgICAgfSxcbiAgICAvLyAgICAgICB7XG4gICAgLy8gICAgICAgICBzcmM6IFwiL2Fzc2V0cy9pY29uL2Nocm9tZS0xOTIucG5nXCIsXG4gICAgLy8gICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgLy8gICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgIC8vICAgICAgIH0sXG4gICAgLy8gICAgIF0sXG4gICAgLy8gICAgIHNob3J0Y3V0czogW1xuICAgIC8vICAgICAgIHtcbiAgICAvLyAgICAgICAgIG5hbWU6IFwiRGVtb1wiLFxuICAgIC8vICAgICAgICAgc2hvcnRfbmFtZTogXCJEZW1vXCIsXG4gICAgLy8gICAgICAgICB1cmw6IFwiL2RlbW8vXCIsXG4gICAgLy8gICAgICAgICBpY29uczogW1xuICAgIC8vICAgICAgICAgICB7XG4gICAgLy8gICAgICAgICAgICAgc3JjOiBcIi9hc3NldHMvaWNvbi9ndWlkZS1tYXNrYWJsZS5wbmdcIixcbiAgICAvLyAgICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgLy8gICAgICAgICAgICAgcHVycG9zZTogXCJtYXNrYWJsZVwiLFxuICAgIC8vICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgLy8gICAgICAgICAgIH0sXG4gICAgLy8gICAgICAgICBdLFxuICAgIC8vICAgICAgIH0sXG4gICAgLy8gICAgIF0sXG4gICAgLy8gICB9LFxuICAgIC8vIH0sXG4gIH0sXG59KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3Rqcy1uZXh0L2RvY3Mvc3JjLy52dWVwcmVzcy9uYXZiYXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMtbmV4dC9kb2NzL3NyYy8udnVlcHJlc3MvbmF2YmFyL25hdmJhci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzLW5leHQvZG9jcy9zcmMvLnZ1ZXByZXNzL25hdmJhci9uYXZiYXIudHNcIjtpbXBvcnQgeyBOYXZiYXJJdGVtIH0gZnJvbSAndnVlcHJlc3MtdGhlbWUtaG9wZSc7XG5cbmltcG9ydCB7IHBhdGggfSBmcm9tICdAdnVlcHJlc3MvdXRpbHMnO1xuaW1wb3J0IHsgbmF2YmFyIH0gZnJvbSAndnVlcHJlc3MtdGhlbWUtaG9wZSc7XG5pbXBvcnQgeyBMT0NBTEVTIH0gZnJvbSAnLi4vbG9jYWxlcyc7XG5pbXBvcnQgeyBleHRyYWN0SW5mbywgZmluZEluZGV4TWQsIGxpc3RNZERpcnMsIGxpc3RNZEZpbGVzIH0gZnJvbSAnLi4vbWQvdXRpbHMnO1xuXG5mdW5jdGlvbiBmaW5kRmlyc3RNZChkaXI6IHN0cmluZykge1xuICBjb25zdCBtZCA9IGxpc3RNZEZpbGVzKGRpcilbMF07XG5cbiAgaWYgKG1kKSB7XG4gICAgcmV0dXJuIG1kO1xuICB9XG5cbiAgcmV0dXJuIGxpc3RNZERpcnMoZGlyKS5tYXAoKGQpID0+XG4gICAgcGF0aC5qb2luKGQsIGZpbmRGaXJzdE1kKHBhdGguam9pbihkaXIsIGQpKSksXG4gIClbMF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOYXZiYXIobG9jYWxlUHJlZml4ID0gJy8nKSB7XG4gIGNvbnN0IGxvY2FsZXNEaXJzID0gT2JqZWN0LmtleXMoTE9DQUxFUylcbiAgICAuZmlsdGVyKChsKSA9PiBsICE9PSBsb2NhbGVQcmVmaXgpXG4gICAgLm1hcCgobCkgPT4gbC5yZXBsYWNlQWxsKCcvJywgJycpKTtcblxuICBjb25zdCBkaXJzID0gbGlzdE1kRGlycyhsb2NhbGVQcmVmaXgpLmZpbHRlcigoZCkgPT4gIWxvY2FsZXNEaXJzLmluY2x1ZGVzKGQpKTtcblxuICByZXR1cm4gbmF2YmFyKFtcbiAgICAnLycsXG4gICAgLi4uZGlyc1xuICAgICAgLm1hcCgoZCkgPT4gW2QsIGZpbmRJbmRleE1kKGQpXSlcbiAgICAgIC5maWx0ZXIoKFtfZGlyLCBpbmRleF0pID0+ICEhaW5kZXgpXG4gICAgICAubWFwKChbZGlyLCBpbmRleF0pID0+IHtcbiAgICAgICAgZGVidWdnZXI7XG4gICAgICAgIGNvbnN0IG1kID0gZmluZEZpcnN0TWQoZGlyIGFzIHN0cmluZyk7XG5cbiAgICAgICAgWzBdO1xuICAgICAgICBjb25zdCB7IGljb24sIHRpdGxlIH0gPSBleHRyYWN0SW5mbyhpbmRleCBhcyBzdHJpbmcpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRleHQ6IHRpdGxlLFxuICAgICAgICAgIGxpbms6IGAke2xvY2FsZVByZWZpeH0ke2Rpcn0vJHttZH1gLFxuICAgICAgICAgIGljb24sXG4gICAgICAgIH0gc2F0aXNmaWVzIE5hdmJhckl0ZW07XG4gICAgICB9KSxcbiAgXSk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMtbmV4dC9kb2NzL3NyYy8udnVlcHJlc3MvbWRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL25pY29sYXMvcHJvamVjdHMvYXNwZWN0anMtbmV4dC9kb2NzL3NyYy8udnVlcHJlc3MvbWQvdXRpbHMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3Rqcy1uZXh0L2RvY3Mvc3JjLy52dWVwcmVzcy9tZC91dGlscy50c1wiO2ltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYywgcmVhZGRpclN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBwYXRoIH0gZnJvbSAnQHZ1ZXByZXNzL3V0aWxzJztcbmltcG9ydCB7IGNyZWF0ZU1hcmtkb3duIH0gZnJvbSAnQHZ1ZXByZXNzL21hcmtkb3duJztcblxuaW1wb3J0IHsgUk9PVF9ESVIgfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0TWREaXJzKHJvb3QgPSAnLicpIHtcbiAgcmV0dXJuIHJlYWRkaXJTeW5jKHBhdGguam9pbihST09UX0RJUiwgcm9vdCksIHtcbiAgICB3aXRoRmlsZVR5cGVzOiB0cnVlLFxuICB9KVxuICAgIC5maWx0ZXIoKGRpcmVudCkgPT4gZGlyZW50LmlzRGlyZWN0b3J5KCkpXG4gICAgLm1hcCgoZGlyZW50KSA9PiBkaXJlbnQubmFtZSlcbiAgICAuZmlsdGVyKChkKSA9PiBsaXN0TWRGaWxlcyhwYXRoLmpvaW4ocm9vdCwgZCksIGZhbHNlKS5sZW5ndGgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZEluZGV4TWQoZGlyOiBzdHJpbmcsIGZpbGVuYW1lID0gJ1JFQURNRS5tZCcpIHtcbiAgY29uc3QgZmlsZSA9IHBhdGguam9pbihST09UX0RJUiwgZGlyLCBmaWxlbmFtZSk7XG4gIHJldHVybiBleGlzdHNTeW5jKGZpbGUpID8gcGF0aC5yZWxhdGl2ZShST09UX0RJUiwgZmlsZSkgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0SW5mbyhmaWxlbmFtZTogc3RyaW5nKSB7XG4gIGxldCBlbnY6IGFueSA9IHt9O1xuXG4gIGNyZWF0ZU1hcmtkb3duKHtcbiAgICBoZWFkZXJzOiB7XG4gICAgICBsZXZlbDogWzEsIDIsIDMsIDRdLFxuICAgIH0sXG4gIH0pLnJlbmRlcihyZWFkRmlsZVN5bmMocGF0aC5qb2luKFJPT1RfRElSLCBmaWxlbmFtZSkpLnRvU3RyaW5nKCksIGVudik7XG5cbiAgY29uc3QgdGl0bGUgPVxuICAgIGVudi5oZWFkZXJzLnNvcnQoKGgxOiBhbnksIGgyOiBhbnkpID0+IGgxLmxldmVsIC0gaDIubGV2ZWwpWzBdPy50aXRsZSA/P1xuICAgIGZpbGVuYW1lO1xuXG4gIGNvbnN0IGljb24gPSBlbnYuZnJvbnRtYXR0ZXI/Lmljb24gPz8gJyc7XG4gIHJldHVybiB7IHRpdGxlLCBpY29uIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0TWRGaWxlcyhkaXJuYW1lOiBzdHJpbmcsIGZpbHRlcklnbm9yZWQgPSB0cnVlKSB7XG4gIGNvbnN0IGRpciA9IHBhdGguam9pbihST09UX0RJUiwgZGlybmFtZSk7XG4gIHJldHVybiByZWFkZGlyU3luYyhkaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KVxuICAgIC5maWx0ZXIoKGYpID0+IGYuaXNGaWxlKCkgJiYgZi5uYW1lLmVuZHNXaXRoKCcubWQnKSlcbiAgICAubWFwKChmKSA9PiBmLm5hbWUpXG4gICAgLmZpbHRlcigoZmlsZXBhdGg6IHN0cmluZykgPT4gIXBhdGguYmFzZW5hbWUoZmlsZXBhdGgpLnN0YXJ0c1dpdGgoJ18nKSlcbiAgICAuZmlsdGVyKChmKSA9PiB7XG4gICAgICBpZiAoIWZpbHRlcklnbm9yZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBjb25zdCBlbnYgPSB7fSBhcyBhbnk7XG4gICAgICBjcmVhdGVNYXJrZG93bih7fSkucmVuZGVyKFxuICAgICAgICByZWFkRmlsZVN5bmMocGF0aC5qb2luKGRpciwgZikpLnRvU3RyaW5nKCksXG4gICAgICAgIGVudixcbiAgICAgICk7XG4gICAgICByZXR1cm4gZW52LmZyb250bWF0dGVyLmluZGV4ICE9PSBmYWxzZTtcbiAgICB9KVxuICAgIC5zb3J0KChzMSwgczIpID0+XG4gICAgICBzMS5sb2NhbGVDb21wYXJlKHMyLCAnZW4nLCB7XG4gICAgICAgIG51bWVyaWM6IHRydWUsXG4gICAgICAgIGlnbm9yZVB1bmN0dWF0aW9uOiB0cnVlLFxuICAgICAgfSksXG4gICAgKTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3Rqcy1uZXh0L2RvY3Mvc3JjLy52dWVwcmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3Rqcy1uZXh0L2RvY3Mvc3JjLy52dWVwcmVzcy91dGlscy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzLW5leHQvZG9jcy9zcmMvLnZ1ZXByZXNzL3V0aWxzLnRzXCI7aW1wb3J0IHsgZGlybmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5cbmV4cG9ydCBjb25zdCBST09UX0RJUiA9IGpvaW4oZmlsZVVSTFRvUGF0aChkaXJuYW1lKGltcG9ydC5tZXRhLnVybCkpLCAnLi4nKTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvbmljb2xhcy9wcm9qZWN0cy9hc3BlY3Rqcy1uZXh0L2RvY3Mvc3JjLy52dWVwcmVzcy9zaWRlYmFyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzLW5leHQvZG9jcy9zcmMvLnZ1ZXByZXNzL3NpZGViYXIvc2lkZWJhci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9uaWNvbGFzL3Byb2plY3RzL2FzcGVjdGpzLW5leHQvZG9jcy9zcmMvLnZ1ZXByZXNzL3NpZGViYXIvc2lkZWJhci50c1wiO2ltcG9ydCB7IHBhdGggfSBmcm9tICdAdnVlcHJlc3MvdXRpbHMnO1xuaW1wb3J0IHsgc2lkZWJhciwgU2lkZWJhckl0ZW0sIFNpZGViYXJPcHRpb25zIH0gZnJvbSAndnVlcHJlc3MtdGhlbWUtaG9wZSc7XG5pbXBvcnQgeyBleHRyYWN0SW5mbywgZmluZEluZGV4TWQsIGxpc3RNZERpcnMsIGxpc3RNZEZpbGVzIH0gZnJvbSAnLi4vbWQvdXRpbHMnO1xuXG5pbXBvcnQgeyBMT0NBTEVTIH0gZnJvbSAnLi4vbG9jYWxlcyc7XG5cbmZ1bmN0aW9uIGJ1aWxkU2lkZWJhckl0ZW1zKGRpcjogc3RyaW5nKTogU2lkZWJhckl0ZW0ge1xuICBjb25zdCBjaGlsZHJlbjogU2lkZWJhckl0ZW1bXSA9IGxpc3RNZERpcnMoZGlyKVxuICAgIC5tYXAoKGQpID0+IHBhdGguam9pbihkaXIsIGQpKVxuICAgIC5tYXAoKGQpID0+IHtcbiAgICAgIHJldHVybiBidWlsZFNpZGViYXJJdGVtcyhkKTtcbiAgICB9KVxuICAgIC5jb25jYXQobGlzdE1kRmlsZXMoZGlyKS5tYXAoKGQpID0+IHBhdGguam9pbihkaXIsIGQpKSBhcyBhbnkpO1xuXG4gIC8vIC5zb3J0KChbczFdLCBbczJdKSA9PiB7XG4gIC8vICAgcmV0dXJuIHMxLmxvY2FsZUNvbXBhcmUoczIsIGxvY2FsZSwge1xuICAvLyAgIG51bWVyaWM6IHRydWUsXG4gIC8vICAgaWdub3JlUHVuY3R1YXRpb246IHRydWUsXG4gIC8vIH0pXG5cbiAgY29uc3QgbWRJbmRleCA9IGZpbmRJbmRleE1kKGRpcik7XG4gIGNvbnN0IHsgaWNvbiwgdGl0bGUgfSA9IG1kSW5kZXhcbiAgICA/IGV4dHJhY3RJbmZvKG1kSW5kZXgpXG4gICAgOiB7IGljb246ICcnLCB0aXRsZTogZGlyIH07XG5cbiAgcmV0dXJuIHtcbiAgICB0ZXh0OiB0aXRsZSxcbiAgICBpY29uLFxuICAgIGNoaWxkcmVuLFxuICB9IHNhdGlzZmllcyBTaWRlYmFySXRlbTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTaWRlYmFyKGxvY2FsZVByZWZpeCA9ICcvJykge1xuICBjb25zdCBsb2NhbGVzRGlycyA9IE9iamVjdC5rZXlzKExPQ0FMRVMpXG4gICAgLmZpbHRlcigobCkgPT4gbCAhPT0gbG9jYWxlUHJlZml4KVxuICAgIC5tYXAoKGwpID0+IGwucmVwbGFjZUFsbCgnLycsICcnKSk7XG5cbiAgY29uc3QgZGlycyA9IGxpc3RNZERpcnMobG9jYWxlUHJlZml4KVxuICAgIC5maWx0ZXIoKGQpID0+ICFsb2NhbGVzRGlycy5pbmNsdWRlcyhkKSlcbiAgICAubWFwKChkKSA9PiBwYXRoLmpvaW4obG9jYWxlUHJlZml4LCBkKSk7XG5cbiAgcmV0dXJuIHNpZGViYXIoXG4gICAgZGlycy5yZWR1Y2UoKGNvbmZpZzogYW55LCBkaXIpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmNvbmZpZyxcbiAgICAgICAgW2Ake2Rpcn0vYF06IFtidWlsZFNpZGViYXJJdGVtcyhkaXIpXSxcbiAgICAgIH07XG4gICAgfSwge30gYXMgYW55IGFzIFNpZGViYXJPcHRpb25zKSxcbiAgKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlUsU0FBUyx3QkFBd0I7OztBQ0F4QixJQUFNLFVBQVU7QUFBQSxFQUNwVyxLQUFLO0FBQUEsSUFDSCxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxhQUFhO0FBQUEsRUFDZjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLElBQ1AsYUFBYTtBQUFBLEVBQ2Y7QUFDRjs7O0FDWDJVLFNBQVMsaUJBQThCOzs7QUNFbFgsU0FBUyxRQUFBQSxhQUFZO0FBQ3JCLFNBQVMsY0FBYzs7O0FDSDZULFNBQVMsWUFBWSxjQUFjLG1CQUFtQjtBQUMxWSxTQUFTLFlBQVk7QUFDckIsU0FBUyxzQkFBc0I7OztBQ0Y0UyxTQUFTLFNBQVMsWUFBWTtBQUN6VyxTQUFTLHFCQUFxQjtBQURrTCxJQUFNLDJDQUEyQztBQUcxUCxJQUFNLFdBQVcsS0FBSyxjQUFjLFFBQVEsd0NBQWUsQ0FBQyxHQUFHLElBQUk7OztBREduRSxTQUFTLFdBQVcsT0FBTyxLQUFLO0FBQ3JDLFNBQU8sWUFBWSxLQUFLLEtBQUssVUFBVSxJQUFJLEdBQUc7QUFBQSxJQUM1QyxlQUFlO0FBQUEsRUFDakIsQ0FBQyxFQUNFLE9BQU8sQ0FBQyxXQUFXLE9BQU8sWUFBWSxDQUFDLEVBQ3ZDLElBQUksQ0FBQyxXQUFXLE9BQU8sSUFB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
