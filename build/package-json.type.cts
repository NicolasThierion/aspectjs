import findUp from 'find-up';
import { readFileSync } from 'fs';
import json5 from 'json5';
import { dirname, isAbsolute, relative } from 'path';
const { parse } = json5;

interface PackageJsonInit {
  readonly main?: any | string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly license: string;
  readonly exports?: Record<string, Record<string, string>>;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
}

// This file was created with the help of  https://github.com/VitorLuizC/typescript-library-boilerplate
export class PackageJson {
  readonly main?: any | string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly license: string;
  readonly exports: Record<string, string | Record<string, string>>;
  readonly dependencies: Record<string, string>;
  readonly devDependencies: Record<string, string>;
  readonly peerDependencies: Record<string, string>;

  constructor(
    pkg: PackageJsonInit,
    readonly dir?: string,
    readonly file?: string,
  ) {
    this.main = pkg.main;
    this.name = pkg.name;
    this.version = pkg.version;
    this.author = pkg.author;
    this.license = pkg.license;
    this.exports = pkg.exports ?? {};
    this.dependencies = pkg.dependencies ?? {};
    this.devDependencies = pkg.devDependencies ?? {};
    this.peerDependencies = pkg.peerDependencies ?? {};
  }

  findExports() {
    const exportEntries = Object.entries(this.exports);

    if (this.main) {
      exportEntries.push(['', this.main]);
    }

    return exportEntries
      .map(([path, files]) => ({
        path: path.match(/\.?\/?(?<name>.*)/)?.groups!['name']!,
        files,
      }))
      .reduce(
        (exports, { path, files }) => {
          const name = [this.name, path].filter((e) => !!e).join('/');

          exports[name] ??= {
            files: {},
            path,
            name,
          };

          if (typeof files === 'string') {
            exports[name]!.files['default'] = files;
          } else {
            Object.entries(files).forEach(([type, file]) => {
              exports[name]!.files[type] = file;
            });
          }

          return exports;
        },
        {} as Record<string, Mutable<PackageExport>>,
      );
  }

  findExport(inputFile: string): PackageExport {
    if (isAbsolute(inputFile) && !this.dir) {
      throw new Error(
        `cannot resolve relative path given absolute path ${inputFile}`,
      );
    }

    const relativeDir = isAbsolute(inputFile)
      ? relative(this.dir!, dirname(inputFile))
      : dirname(inputFile);

    const matchingExport = Object.values(this.findExports()).filter(
      (packageExport) => packageExport.path === relativeDir,
    )[0];
    // .filter(({ exportName }) => exportName === relativeDir)

    if (!matchingExport) {
      throw new Error(`${inputFile}: no matching export found in package.json`);
    }

    return matchingExport;
  }

  static read(dir: string) {
    const packageJsonPath = findPackageJson(dir);
    return new PackageJson(
      parse(readFileSync(packageJsonPath).toString()),
      dirname(packageJsonPath),
      packageJsonPath,
    );
  }
}

export interface PackageExport {
  readonly path: string;
  readonly name: string;
  readonly files: Record<string, string>;
}

function findPackageJson(cwd: string) {
  const packageJsonPath = findUp.sync(['package.json'], {
    cwd,
  });

  if (!packageJsonPath || dirname(packageJsonPath) === __dirname) {
    throw new Error(`package.json not found in directory ${dirname}`);
  }

  return packageJsonPath;
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] };
