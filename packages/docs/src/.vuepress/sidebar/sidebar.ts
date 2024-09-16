import { path } from '@vuepress/utils';
import { lstatSync } from 'fs';
import {
  sidebar,
  SidebarArrayOptions,
  SidebarOptions,
} from 'vuepress-theme-hope';
import { extractInfo, findIndexMd, listMdDirs, listMdFiles } from '../md/utils';

import { LOCALES } from '../locales';
import { ROOT_DIR } from '../utils';
import { sidebarSorter } from './sidebar-sorter';
const COLLABSIBLE_LENGTH_THRESHOLD = 4;

function buildSidebarItems(dir: string): SidebarArrayOptions {
  const children: string[] = listMdFiles(dir)
    // .sort((s1, s2) => {
    //   if (s1 === 'README.md') return 1;
    //   return s1.localeCompare(s2, 'en', {
    //     numeric: true,
    //     ignorePunctuation: true,
    //   });
    // })
    .map((filename) => {
      const filepath = path.join(dir, filename);
      return [filename, filepath, filepath];
    })
    .concat(
      listMdDirs(dir).map((filename) => {
        const filepath = path.join(dir, filename);
        return [filename, filepath, buildSidebarItems(filepath)];
      }) as any,
    )
    .sort(([filename1, filepath1], [filename2, filepath2]) => {
      return sidebarSorter(
        {
          filename: filename1,
          type: lstatSync(path.join(ROOT_DIR, filepath1)).isDirectory()
            ? 'dir'
            : 'file',
        },
        {
          filename: filename2,
          type: lstatSync(path.join(ROOT_DIR, filepath2)).isDirectory()
            ? 'dir'
            : 'file',
        },
      );
    })
    .map(([_filenaem, _filepath, config]) => config);

  const mdIndex = findIndexMd(dir);
  const basename = path.basename(dir);
  const { icon, title } = mdIndex
    ? extractInfo(mdIndex)
    : {
        icon: '',
        title: `${basename.charAt(0).toUpperCase()}${basename.slice(1)}`,
      };

  return {
    text: title,
    children,
    icon,
    collapsible: children?.length > COLLABSIBLE_LENGTH_THRESHOLD,
  };
}
export function createSidebar(localePrefix = '/') {
  const localesDirs = Object.keys(LOCALES)
    .filter((l) => l !== localePrefix)
    .map((l) => l.replaceAll('/', ''));

  const dirs = listMdDirs(localePrefix)
    .filter((d) => !localesDirs.includes(d))
    .map((d) => path.join(localePrefix, d));

  return sidebar(
    dirs.reduce((options: any, dir) => {
      const config = buildSidebarItems(dir);
      return {
        ...options,
        [`${dir}/`]: [config],
      } as SidebarOptions;
    }, {} as SidebarOptions),
  );
}
