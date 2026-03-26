import { defineConfig } from 'vite';
export default defineConfig({
  base: '/shinlion-defense/',
  build: { outDir: 'dist' },
  server: { port: 3002, open: true },
});
