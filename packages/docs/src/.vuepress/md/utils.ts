import { createMarkdown } from '@vuepress/markdown';
import { path } from '@vuepress/utils';
import { existsSync, readFileSync, readdirSync } from 'fs';

import { ROOT_DIR } from '../utils';

export function listMdDirs(root = '.') {
  return readdirSync(path.join(ROOT_DIR, root), {
    withFileTypes: true,
  })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((d) => listMdFiles(path.join(root, d), false).length);
}

export function findIndexMd(dir: string, filename = 'README.md') {
  const file = path.join(ROOT_DIR, dir, filename);
  return existsSync(file) ? path.relative(ROOT_DIR, file) : undefined;
}

export function extractInfo(filename: string) {
  let env: any = {};

  createMarkdown({
    headers: {
      level: [1, 2, 3, 4],
    },
  }).render(readFileSync(path.join(ROOT_DIR, filename)).toString(), env);

  const title =
    env.headers.sort((h1: any, h2: any) => h1.level - h2.level)[0]?.title ??
    filename;

  const icon = env.frontmatter?.icon ?? '';
  return { title, icon };
}

export function listMdFiles(dirname: string, filterIgnored = true): string[] {
  const dir = path.join(ROOT_DIR, dirname);
  return readdirSync(dir, { withFileTypes: true })
    .filter((f) => f.isFile() && f.name.endsWith('.md'))
    .map((f) => f.name)
    .filter((filepath: string) => !path.basename(filepath).startsWith('_'))
    .filter((f) => {
      if (!filterIgnored) {
        return true;
      }
      const env = {} as any;
      createMarkdown({}).render(
        readFileSync(path.join(dir, f)).toString(),
        env,
      );
      return env.frontmatter.index !== false;
    })
    .sort((s1, s2) =>
      s1.localeCompare(s2, 'en', {
        numeric: true,
        ignorePunctuation: true,
      }),
    );
}
