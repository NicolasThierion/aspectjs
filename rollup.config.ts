import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import findUp from 'find-up';
import { globSync } from 'glob';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'path';
import type {
  InputPluginOption,
  ModuleFormat,
  OutputOptions,
  Plugin,
  RollupOptions,
} from 'rollup';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import tmp from 'tmp';
import { PackageJson } from './build/package-json.type.cts';

import type { OutputPlugin } from 'rollup';

import { defineConfig as rollupDefineConfig } from 'rollup';

export interface CreateConfigOptions {
  input?: string;
  outDir?: string;
  external?: string[];
  plugins?: Plugin[];
  output?: {
    preserveModules: boolean;
    globals?: Record<string, string>;
  };
}

export const createConfig = (
  rootDir: string,
  overrideOptions: CreateConfigOptions = {},
) => {
  const outDir = overrideOptions?.outDir ?? 'dist';
  const pkg = PackageJson.read(rootDir);
  const allPackages = findPackageJsons(__dirname).map((p) =>
    PackageJson.read(p),
  );
  const allExports = [
    ...new Set(
      allPackages.flatMap((p) =>
        Object.values(p.findExports()).map((e) => e.name),
      ),
    ),
  ];

  const globals = allExports.reduce(
    (globals, e) => {
      return {
        ...globals,
        [e]: createGlobalName(e),
      };
    },
    {} as Record<string, string>,
  );

  const globalOutputOptions = overrideOptions?.output ?? ({} as any);
  delete overrideOptions?.output;
  const globalOptions = coerceRollupOptions(pkg, overrideOptions);
  globalOptions.external = globalOptions.external.concat(allExports);

  const outputOptions: RollupOptions['output'] = [];
  globalOptions.output = outputOptions;

  const options: RollupOptions[] = [
    runPlugin(
      del({
        targets: [outDir],
        hook: 'buildStart',
      }),
    ),
  ];
  // generate bundles
  options.push(
    ...globalOptions.input.flatMap((input) => {
      const res: RollupOptions[] = [];
      const packageExport = pkg.findExport(input);

      const exportedJsFiles = Object.values(packageExport.files)
        .map((f) => join(outDir, f))
        // types are handled in another output
        .filter((exportFile) => !exportFile.endsWith('.d.ts'));

      const bundleOptions = exportedJsFiles.map((file) => {
        const output = file.match(/.min.js$/)
          ? [
              // generate both min & !min
              createBundleOutput(
                file.replace(/.min.js$/, '.js'),
                packageExport.name,
              ),
              createBundleOutput(file, packageExport.name),
            ]
          : [createBundleOutput(file, packageExport.name)];
        return {
          ...globalOptions,
          input,
          plugins: [
            ...globalOptions.plugins,
            createTypescriptPlugin(
              findTsConfig(join(rootDir, packageExport.path)),
              {},
            ),
          ],
          output,
        } satisfies RollupOptions;
      });

      res.push(...bundleOptions);

      if (packageExport.files['types']) {
        const dtsOptions = {
          ...globalOptions,
          input,
          plugins: [
            ...globalOptions.plugins,
            createDtsPlugin(
              findTsConfig(join(rootDir, packageExport.path)),
              {},
            ),
          ],
          output: [
            {
              format: 'esm',
              globals,
              preserveModules: false,
              // dir: outDir,
              file: join(
                outDir,
                'dts',
                `${packageExport.name.split('/').splice(-1)[0]!}.js`,
              ),
            },
          ],
        } satisfies RollupOptions;

        const dtsBundleOptions = {
          ...globalOptions,
          input,
          plugins: [
            ...globalOptions.plugins,
            dts(),
            del({
              targets: [join(outDir, 'dts')],
              hook: 'buildEnd',
            }),
          ],
          output: [
            {
              file: join(outDir, packageExport.files['types']!),
              format: 'esm',
            },
          ],
        } satisfies RollupOptions;
        res.push(dtsOptions, dtsBundleOptions);
      }

      return res;
    }),
  );

  options.push(copyPackageJson(pkg.file!, outDir));

  options.push(copyReadme());
  options
    .flatMap((o) => o.output)
    .filter((o) => !!o)
    .forEach((o) => {
      o!.globals = {
        ...o!.globals,
        ...globalOutputOptions.globals,
      };
    });

  return rollupDefineConfig(options);

  function coerceRollupOptions(
    pkg: PackageJson,
    options: CreateConfigOptions = {},
  ): Omit<RollupOptions, 'external'> & {
    input: string[];
    output: OutputOptions[];
    plugins: InputPluginOption[];
    external: string[];
  } {
    const input: string[] = (
      Array.isArray(options.input)
        ? options.input
        : typeof options.input === 'string'
        ? [options.input]
        : inferInputFilesFromPackage(pkg)
    ).map((i) => (isAbsolute(i) ? i : resolve(rootDir, i)));

    if (options.output) {
      throw new Error('specified option "output" is not supported');
    }

    const res: ReturnType<typeof coerceRollupOptions> = {
      ...options,
      input,
      external: [],
      plugins: [],
      output: [],
    };
    if (options?.external) {
      res.external = res.external.concat(options.external as any[]);
    }
    if (options?.plugins) {
      res.plugins = res.plugins.concat(options.plugins!);
    }

    return res;
  }

  function inferInputFilesFromPackage(pkg: PackageJson): string[] {
    const inputFiles = Object.keys(pkg.exports ?? {}).map((exportDir) => {
      const entrydir = join(rootDir, exportDir);
      let indexFile =
        overrideOptions.input ??
        globSync(
          [
            'index.{js,ts,mjs,cjs,mts,cts,jsx,tsx}',
            'public_api.{js,ts,mjs,cjs,mts,cts,jsx,tsx}',
          ],
          {
            cwd: entrydir,
          },
        )[0];

      if (!indexFile) {
        throw new Error(`index.{js,ts} not found in directory ${entrydir}`);
      }

      return join(rootDir, exportDir, indexFile);
    });

    return inputFiles;
  }
  function createBundleOutput(
    exportFile: string,
    exportName: string,
  ): OutputOptions {
    const format: ModuleFormat | 'dts' = inferFormatFromFile(exportFile);
    if (format === 'dts') {
      throw new Error(`.d.ts bundle not supported at the moment`);
    }

    const preserveModules =
      globalOutputOptions.preserveModules ??
      !inferFlatFromExportFilename(exportFile);

    const plugins: OutputPlugin[] = [];

    const minify = exportFile.endsWith('.min.js');
    if (minify) {
      plugins.push(
        terser({
          compress: true,
          ie8: false,
          keep_classnames: true,
          ecma: 5,
        }),
      );
    }

    const name = createGlobalName(exportName);

    const outputOptions: OutputOptions = {
      format,
      ...globalOutputOptions,

      entryFileNames: `[name]${extname(exportFile)}`,
      plugins,
      name,
      exports: 'named',
      globals,
      banner: makeBanner(pkg),
    };

    if (format !== 'umd') {
      // specify preserveModules breaks UMD build for unknown reason
      outputOptions.preserveModules = preserveModules;
    }
    if (preserveModules) {
      outputOptions.dir = dirname(exportFile);
    } else {
      outputOptions.file = exportFile;
    }

    return outputOptions;
  }

  function copyPackageJson(
    packageJsonPath: string,
    distDir: string,
  ): RollupOptions {
    return runPlugin(
      copy({
        targets: [
          {
            src: packageJsonPath,
            dest: distDir,
            transform(contents) {
              const packageJson: PackageJson = JSON.parse(contents.toString());

              allExports.forEach((p) => {
                for (const d of [
                  'dependencies',
                  'devDependencies',
                  'peerDependencies',
                ] satisfies (keyof PackageJson)[])
                  if (packageJson[d]?.[p]) {
                    packageJson[d][p] = `^${packageJson['version']}`;
                  }
              });
              return JSON.stringify(packageJson, null, 2);
            },
          },
        ],
      }),
    );
  }

  function createTypescriptPlugin(
    tsconfig: string | undefined,
    options: Partial<Parameters<typeof esbuild>[0]> = {},
  ): OutputPlugin {
    return esbuild({
      ...options,

      // cacheDir: '.rollup.tscache',
      tsconfig,

      sourceMap: true,
      // explicitly disable declarations, as a rollup config is dedicated for them
    });
  }

  function copyReadme() {
    const readme =
      findUp.sync('README.md', { cwd: rootDir }) ??
      findUp.sync('readme.md', { cwd: rootDir }) ??
      findUp.sync('Readme.md', { cwd: rootDir }) ??
      'README.md';
    const assetsDir =
      findUp.sync('.assets', {
        cwd: rootDir,
        type: 'directory',
      }) ?? '.assets';

    return runPlugin(
      copy({
        targets: [
          { src: assetsDir, dest: outDir },
          {
            src: readme,
            dest: outDir,
            caseSensitiveMatch: false,
          },
        ],
      }),
    );
  }
};

function createGlobalName(packageName: string) {
  return packageName
    .replace(/^@/, '')
    .split('/')
    .filter((p) => !!p)
    .join('.')
    .replaceAll(/-(\w)/g, (_m, g) => g.toUpperCase());
}

function inferFormatFromFile(exportFile: string): ModuleFormat | 'dts' {
  switch (extname(exportFile).toLowerCase()) {
    case '.cjs':
      return 'cjs';
    case '.mjs':
      return 'esm';
    case '.js':
      return 'umd';
    default:
      if (exportFile.endsWith('.d.ts')) {
        return 'dts';
      }
      throw new TypeError(
        `Unsupported file extension for entrypoint ${exportFile as any}`,
      );
  }
}

function inferFlatFromExportFilename(exportFile: string) {
  if (inferFormatFromFile(exportFile) === 'umd') {
    return true;
  }
  return !!exportFile.match(/fesm.*\//g);
}

function findTsConfig(cwd: string) {
  const tsconfigPath = findUp.sync(
    ['tsconfig.lib.json', 'tsconfig.app.json', 'tsconfig.json'],
    {
      cwd,
    },
  );

  if (!tsconfigPath) {
    throw new Error(`tsconfig.json not found in directory ${cwd}`);
  }

  return tsconfigPath;
}

function createDtsPlugin(
  tsconfig: string | undefined,
  options: Partial<Parameters<typeof typescript>[0]> = {},
): OutputPlugin {
  return typescript({
    ...options,
    tsconfig,
    sourceMap: false,
    declaration: true,
    declarationDir: join('types'),
    emitDeclarationOnly: true,
    skipLibCheck: true,
    noUnusedParameters: false,
    noUnusedLocals: false,
  });
}

function findPackageJsons(rootDir: string) {
  return globSync('**/package.json', {
    cwd: rootDir,
    ignore: ['**/node_modules/**/*', '**/dist/**/*'],
  }).map((p) => join(rootDir, p));
}

function runPlugin(...plugins: Plugin[]): RollupOptions {
  const dumyInput = tmp.fileSync({
    template: 'EMPTY-XXXXXX',
  }).name;

  return {
    input: dumyInput,
    onwarn: (warning, defaultHandler) => {
      if (
        warning.code === 'EMPTY_BUNDLE' &&
        warning.names![0] === basename(dumyInput)
      ) {
        return;
      }

      defaultHandler(warning);
    },
    plugins,
  };
}
function makeBanner(pkg: PackageJson) {
  /**
   * Comment with library information to be appended in the generated bundles.
   */
  return `/*!
* ${pkg.name} v${pkg.version}
* (c) ${pkg.author}
* Released under the ${pkg.license} License.
*/
`;
}
