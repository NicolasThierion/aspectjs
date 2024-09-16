import viteBundler from '@vuepress/bundler-vite';
import { defineUserConfig } from 'vuepress';
import { LOCALES } from './locales';
import theme from './theme.js';

export default defineUserConfig({
  base: '/',

  locales: LOCALES,

  theme,
  bundler: viteBundler({
    viteOptions: {},
    vuePluginOptions: {},
  }),

  // Enable it with pwa
  // shouldPrefetch: false,
});
