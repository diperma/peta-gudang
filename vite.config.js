import { defineConfig } from 'vite';

export default defineConfig({
  base: '/peta-gudang/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: true,
  },
});
