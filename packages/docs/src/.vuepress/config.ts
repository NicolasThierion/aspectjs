import { defineUserConfig } from 'vuepress';
import { LOCALES } from './locales';
import theme from './theme.js';

export default defineUserConfig({
  base: '/',

  locales: LOCALES,

  theme,

  // Enable it with pwa
  // shouldPrefetch: false,
});
