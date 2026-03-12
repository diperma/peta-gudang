import { defineConfig } from 'vite';

export default defineConfig({
  base: '/peta-gudang/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/proxy': 'http://localhost:3001',
    },
  },
});
