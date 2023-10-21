import chokidar from 'chokidar';
import { findUpSync } from 'find-up';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import Handlebars from 'handlebars';
import json5 from 'json5';
import { dirname, join } from 'path';
import { Application, ProjectReflection, TypeDocOptions } from 'typedoc';
import * as url from 'url';
import { PluginFunction, PluginObject } from 'vuepress';
// import { typedocPlugin } from 'vuepress-plugin-typedoc';
const { parse } = json5;

export interface PluginOptions extends TypeDocOptions {
  sidebar?: SidebarOptions;
  hideBreadcrumbs?: boolean;
  hideInPageTOC?: boolean;
}
export interface SidebarOptions {
  fullNames: boolean;
  parentCategory: string;
  autoConfiguration: boolean;
}

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export function typedocPluginConfig(): PluginFunction {
  const entryPoints = findEntrypoints();

  return (...args) => {
    // const pluginFn = typedocPlugin({
    //   // plugin options
    //   entryPoints,
    //   tsconfig: `${__dirname}/tsconfig.json`,
    //   cleanOutputDir: true,
    //   name: 'AspectJS',
    //   readme: join(__dirname, 'README.typedoc.md'),
    //   // excludeInternal: true,
    //   // excludePrivate: true,
    //   // excludeExternals: true,
    //   // groupOrder: ['Modules', 'Variables', 'Functions', '*'],
    //   // excludeNotDocumented: true,
    //   // categorizeByGroup: false,
    //   // hideParameterTypesInTitle: true,

    //   // navigation: {
    //   //   includeCategories: false,
    //   //   includeGroups: false,
    //   // },
    //   // Plugin options
    //   out: 'api',

    //   sidebar: {
    //     fullNames: false,
    //     autoConfiguration: true,
    //     parentCategory: 'API',
    //   },
    // } satisfies Partial<PluginOptions>);

    // override helper to exclude ReflectionKind from sidebar
    const _registerHelper = Handlebars.registerHelper;
    Handlebars.registerHelper = function (...args): void {
      if (args[0] === 'reflectionTitle') {
        return _registerHelper.call(
          this,
          'reflectionTitle',
          function (shouldEscape = true) {
            const title = [''];
            title.push(
              shouldEscape ? escapeChars(this.model.name) : this.model.name,
            );
            if (this.model.typeParameters) {
              const typeParameters = this.model.typeParameters
                .map((typeParameter) => typeParameter.name)
                .join(', ');
              title.push(`<${typeParameters}${shouldEscape ? '\\>' : '>'}`);
            }
            return title.join('');
          },
        );
      }

      return _registerHelper.apply(this, args);
    };

    function escapeChars(str: string) {
      return str
        .replace(/>/g, '\\>')
        .replace(/_/g, '\\_')
        .replace(/`/g, '\\`')
        .replace(/\|/g, '\\|');
    }
    // const plugin = pluginFn(...args);

    let typedocApplication: Application;
    let project: ProjectReflection;
    const opts = {
      entryPoints,
      plugin: ['typedoc-plugin-markdown'],
      includes: entryPoints,
      tsconfig: `${__dirname}/tsconfig.json`,
      cleanOutputDir: true,
      name: 'AspectJS',
      readme: join(__dirname, 'README.typedoc.md'),
      excludeInternal: true,
      excludePrivate: true,
      excludeExternals: true,
      groupOrder: ['Modules', 'Variables', 'Functions', '*'],
      excludeNotDocumented: true,
      categorizeByGroup: false,
      // theme: MarkdownTheme,
      hideParameterTypesInTitle: true,
      navigation: {
        includeCategories: false,
        includeGroups: false,
      },
      // Plugin options
      out: 'src/api',
    } satisfies Partial<TypeDocOptions>;
    const plugin: PluginObject = {
      name: 'my-typedoc',
      async onInitialized(app) {
        typedocApplication = await Application.bootstrapWithPlugins(opts);

        project = (await typedocApplication.convert())!;
        typedocApplication.generateDocs(project, opts.out);

        async (project) => {
          typedocApplication.generateDocs(project, opts.out);
        };
      },
      onWatched(app, watchers, reload) {
        const pagesWatcher = chokidar.watch(
          entryPoints.map((e) => dirname(e)).map((e) => join(e, '**/*.ts')),
          {
            cwd: app.dir.source(),
            ignoreInitial: true,
          },
        );
        pagesWatcher.on('add', async (filePathRelative) => {
          await typedocApplication.generateDocs(project, opts.out);
          reload();
        });
        pagesWatcher.on('change', async (filePathRelative) => {
          await typedocApplication.generateDocs(project, opts.out);
          reload();
        });
        pagesWatcher.on('unlink', async (filePathRelative) => {
          await typedocApplication.generateDocs(project, opts.out);
          reload();
        });

        watchers.push(pagesWatcher);
      },
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
