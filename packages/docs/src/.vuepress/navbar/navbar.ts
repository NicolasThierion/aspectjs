import { NavGroup, NavbarItem, navbar } from 'vuepress-theme-hope';

import { path } from '@vuepress/utils';
import { LOCALES } from '../locales';
import { extractInfo, findIndexMd, listMdDirs, listMdFiles } from '../md/utils';

function findFirstMd(dir: string) {
  const md = listMdFiles(dir)[0];

  if (md) {
    return md;
  }

  return listMdDirs(dir)
    .map((d) => {
      const c = findFirstMd(path.join(dir, d));
      if (c) {
        return path.join(d, c);
      }
    })
    .filter((d) => !!d)[0];
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

        const { icon, title } = extractInfo(index as string);

        const childMd = listMdFiles(dir as string);
        // navitem has children only if it only contains dirs but no markdown other than README.md
        const prefix = `${localePrefix}${dir}/`;
        const children =
          childMd.length < 1 ||
          (childMd.length === 1 && childMd[0].toLowerCase() === 'readme.md')
            ? listMdDirs(dir)
                .map((d) => [d, findIndexMd(`${dir}/${d}`)])
                .filter(([_dir, index]) => !!index)
                .map(([d, index]) => {
                  const md = findFirstMd(dir as string);
                  const { icon, title } = extractInfo(index!);

                  return {
                    text: title,
                    icon,
                    link: `${md}`,
                  } satisfies NavbarItem as any;
                })
            : (undefined as never);

        return {
          text: title,
          link: children?.length ? undefined : `${prefix}${md}`,
          prefix,
          icon,
          children,
        } satisfies NavGroup<NavbarItem>;
      }),
  ]);
}
