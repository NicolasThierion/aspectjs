import { NavbarItem } from 'vuepress-theme-hope';

import { path } from '@vuepress/utils';
import { navbar } from 'vuepress-theme-hope';
import { LOCALES } from '../locales';
import { extractInfo, findIndexMd, listMdDirs, listMdFiles } from '../md/utils';

function findFirstMd(dir: string) {
  const md = listMdFiles(dir)[0];

  if (md) {
    return md;
  }

  return listMdDirs(dir).map((d) =>
    path.join(d, findFirstMd(path.join(dir, d))),
  )[0];
}

export function createNavbar(localePrefix = '/') {
  const localesDirs = Object.keys(LOCALES)
    .filter((l) => l !== localePrefix)
    .map((l) => l.replaceAll('/', ''));

  const dirs = listMdDirs(localePrefix).filter((d) => !localesDirs.includes(d));

  return navbar([
    '/',
    ...dirs
      .map((d) => [d, findIndexMd(d)])
      .filter(([_dir, index]) => !!index)
      .map(([dir, index]) => {
        const md = findFirstMd(dir as string);

        [0];
        const { icon, title } = extractInfo(index as string);
        return {
          text: title,
          link: `${localePrefix}${dir}/${md}`,
          icon,
        } satisfies NavbarItem;
      }),
  ]);
}
