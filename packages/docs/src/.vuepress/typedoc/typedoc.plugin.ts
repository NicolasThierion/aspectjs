import chokidar from 'chokidar';
import { findUpSync } from 'find-up';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import json5 from 'json5';
import { dirname, join } from 'path';
import * as url from 'url';
import { PluginFunction, PluginObject } from 'vuepress';
import { typedocPlugin } from 'vuepress-plugin-typedoc/next';
const { parse } = json5;

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export function typedocPluginConfig(): PluginFunction {
  const entryPoints = findEntrypoints();

  return (...args) => {
    const plugin = typedocPlugin({
      // plugin options
      entryPoints,
      tsconfig: `${__dirname}/tsconfig.json`,
      cleanOutputDir: true,
      name: 'AspectJS',
      readme: join(__dirname, 'README.typedoc.md'),
      excludeInternal: true,
      excludePrivate: true,
      excludeExternals: true,
      groupOrder: ['Modules', 'Variables', 'Functions', '*'],

      // categorizeByGroup: false,
      // navigation: {
      //   includeCategories: false,
      //   includeGroups: false,
      // },
      // Plugin options
      out: 'api',
      sidebar: {
        fullNames: true,
        autoConfiguration: true,
        parentCategory: 'API',
      },
    })(...args);

    (plugin as PluginObject).onWatched = (app, watchers, reload) => {
      const pagesWatcher = chokidar.watch(
        entryPoints.map((e) => dirname(e)).map((e) => join(e, '**/*.ts')),
        {
          cwd: app.dir.source(),
          ignoreInitial: true,
        },
      );
      pagesWatcher.on('add', async (filePathRelative) => {
        reload();
      });
      pagesWatcher.on('change', async (filePathRelative) => {
        reload();
      });
      pagesWatcher.on('unlink', async (filePathRelative) => {
        reload();
      });

      watchers.push(pagesWatcher);
    };
    return plugin;
  };
}

function findEntrypoints() {
  const rootPackagePath = findUpSync('package.json', {
    cwd: join(dirname(findUpSync('package.json', { cwd: __dirname })!), '..'),
  });

  if (!rootPackagePath) {
    throw new Error('Could not find package.json');
  }

  const packageJson = parse(readFileSync(rootPackagePath, 'utf-8'));
  const workspaceDir = dirname(rootPackagePath);

  const packageJsons = (packageJson.workspaces ?? [])
    .map((p) => join(workspaceDir, p))
    .concat(join(workspaceDir, '*'))
    .flatMap((d) => globSync(join(d, 'package.json')));

  const entrypointPattern = 'index.ts';

  return packageJsons
    .map((d) => dirname(d))
    .flatMap((d) => globSync(join(d, entrypointPattern)));
}
