import { findUpSync } from 'find-up';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import Handlebars from 'handlebars';
import json5 from 'json5';
import { dirname, join } from 'path';
import { Application, ProjectReflection, TypeDocOptions } from 'typedoc';
import * as url from 'url';
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

export function configureTypedoc() {
  const entryPoints = findEntrypoints();

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

  return {
    generateDocs: async () => {
      if (!typedocApplication) {
        typedocApplication = await Application.bootstrapWithPlugins(opts);
      }

      if (!project) {
        project = (await typedocApplication.convert())!;
      }

      await typedocApplication.generateDocs(project, opts.out);
    },
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
