import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@blocknote/core': fileURLToPath(new URL('../../blocknote/core/src', import.meta.url)),

      'markdown-operate': fileURLToPath(new URL('../markdown-operate/src', import.meta.url)),
      'custom-blocknote-speaker': fileURLToPath(new URL('../../custom-blocknote/speaker/src', import.meta.url)),
      'custom-blocknote-gradient-styles': fileURLToPath(new URL('../../custom-blocknote/gradient-styles/src', import.meta.url)),
    },
  },
  base: './',
  build: {
    outDir: './dist',
  },
  server: {
    port: 5180,
    host: '::',
  },
})


