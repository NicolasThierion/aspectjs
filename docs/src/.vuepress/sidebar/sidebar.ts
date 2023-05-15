import { path } from '@vuepress/utils';
import { sidebar, SidebarItem, SidebarOptions } from 'vuepress-theme-hope';
import { extractInfo, findIndexMd, listMdDirs, listMdFiles } from '../md/utils';

import { LOCALES } from '../locales';

function buildSidebarItems(dir: string): SidebarItem {
  const children: SidebarItem[] = listMdDirs(dir)
    .map((d) => path.join(dir, d))
    .map((d) => {
      return buildSidebarItems(d);
    })
    .concat(listMdFiles(dir).map((d) => path.join(dir, d)) as any);

  // .sort(([s1], [s2]) => {
  //   return s1.localeCompare(s2, locale, {
  //   numeric: true,
  //   ignorePunctuation: true,
  // })

  const mdIndex = findIndexMd(dir);
  const { icon, title } = mdIndex
    ? extractInfo(mdIndex)
    : { icon: '', title: dir };

  return {
    text: title,
    icon,
    children,
  } satisfies SidebarItem;
}
export function createSidebar(localePrefix = '/') {
  const localesDirs = Object.keys(LOCALES)
    .filter((l) => l !== localePrefix)
    .map((l) => l.replaceAll('/', ''));

  const dirs = listMdDirs(localePrefix)
    .filter((d) => !localesDirs.includes(d))
    .map((d) => path.join(localePrefix, d));

  return sidebar(
    dirs.reduce((config: any, dir) => {
      return {
        ...config,
        [`${dir}/`]: [buildSidebarItems(dir)],
      };
    }, {} as any as SidebarOptions),
  );
}
