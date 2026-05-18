import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://spacechase26.github.io',
  base: '/ca-inter',
  output: 'static',
  trailingSlash: 'ignore',
  server: {
    host: '0.0.0.0',
    port: 4323,
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
