import { SidebarInfo } from 'vuepress-theme-hope';

export function sidebarSorter(
  infoA: SidebarInfo | any,
  infoB: SidebarInfo | any,
) {
  if (infoA.filename === 'README.md') {
    return 1;
  }
  const rx = /^(?<order>\d+).*$/;

  if (infoA.type === 'file' && infoB.type === 'dir') {
    return -1;
  } else if (infoA.type === 'dir' && infoB.type === 'file') {
    return 1;
  }
  const orderA =
    infoA.order ??
    (infoA.filename ?? infoA.dirname).match(rx)?.groups?.order ??
    Infinity;

  const orderB =
    infoB.order ??
    (infoB.filename ?? infoB.dirname).match(rx)?.groups?.order ??
    Infinity;

  if (orderA === orderB) {
    return (infoA.filename ?? infoA.dirname).localeCompare(
      infoB.filename ?? infoB.dirname,
      'en',
      {
        numeric: true,
        ignorePunctuation: true,
      },
    );
  }
  return +orderA - +orderB;
}
