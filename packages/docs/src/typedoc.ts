import type { AppConfig } from '@vuepress/core';
import { createBuildApp } from '@vuepress/core';
import { colors, debug, formatMs, logger } from '@vuepress/utils';
import { cac } from 'cac';
import process from 'node:process';
import type { BuildCommand } from 'vuepress';
import {
  loadUserConfig,
  resolveAppConfig,
  resolveCliAppConfig,
  resolveUserConfigConventionalPath,
  resolveUserConfigPath,
} from 'vuepress';

import { viteBundler } from '@vuepress/bundler-vite';
import { defaultTheme } from '@vuepress/theme-default';

// set default bundler

// import { createBuild, createDev, info } from './commands/index.js'

// const require = createRequire(import.meta.url)

const log = debug('vuepress:cli/build');

export const createBuild =
  (defaultAppConfig: Partial<AppConfig>): BuildCommand =>
  async (sourceDir = '.', commandOptions = {}): Promise<void> => {
    const start = Date.now();

    log(`commandOptions:`, commandOptions);

    if (process.env['NODE_ENV'] === undefined) {
      process.env['NODE_ENV'] = 'production';
    }

    // resolve app config from cli options
    const cliAppConfig = resolveCliAppConfig(sourceDir, commandOptions);

    // resolve user config file
    const userConfigPath = commandOptions.config
      ? resolveUserConfigPath(commandOptions.config)
      : resolveUserConfigConventionalPath(cliAppConfig.source);
    log(`userConfigPath:`, userConfigPath);
    const { userConfig } = await loadUserConfig(userConfigPath);

    // resolve the final app config to use
    const appConfig = resolveAppConfig({
      defaultAppConfig,
      cliAppConfig,
      userConfig,
    });
    if (appConfig === null) {
      return;
    }

    // create vuepress app
    const app = createBuildApp(appConfig);
    app.pluginApi.plugins = app.pluginApi.plugins.filter(
      (p) => p.name === 'vuepress-plugin-typedoc',
    );
    // typedocPluginConfig()(app);

    logger.success(
      `Typedoc build completed in ${formatMs(Date.now() - start)}!`,
    );
  };
/**
 * Vuepress cli
 */
export const cli = ((defaultAppConfig: Partial<AppConfig> = {}): void => {
  // create cac instance
  const program = cac('typedoc');

  // register `dev` command
  program
    .command('[sourceDir]', 'build the documentation')
    .action(createBuild(defaultAppConfig));

  program.parse(process.argv, { run: false });

  // run command or fallback to help messages
  if (program.matchedCommand) {
    program.runMatchedCommand().catch((err: any) => {
      console.error(colors.red(err.stack));
      process.exit(1);
    });
  } else {
    program.outputHelp();
  }
})({ bundler: viteBundler(), theme: defaultTheme() });
