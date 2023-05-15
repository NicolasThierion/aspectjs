import { App, PluginFunction } from 'vuepress';
import chokidar from 'chokidar';

function computeNavbar(app: App) {
  app;
}
export const customNavbar: () => PluginFunction = () => {
  return (app) => {
    return {
      name: 'custom-navbar',
      onInitialized: (app) => {
        // app.siteData.title = m3Context.name;
        // app.siteData.description = m3Context.description;
      },
      define: (app) => {},

      onWatched: (app, watchers) => {
        const pagesWatcher = chokidar.watch(app.options.pagePatterns, {
          cwd: app.dir.source(),
          ignoreInitial: true,
        });
        pagesWatcher.on('add', async (filePathRelative) => {
          computeNavbar(app);
        });
        pagesWatcher.on('change', async (filePathRelative) => {
          computeNavbar(app);
        });
        pagesWatcher.on('unlink', async (filePathRelative) => {
          computeNavbar(app);
        });

        watchers.push(pagesWatcher);
      },

      extendsPage: (page) => {},
    };
  };
};
