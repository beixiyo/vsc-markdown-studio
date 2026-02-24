import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@blocknote/core': fileURLToPath(new URL('../../blocknote/core/src', import.meta.url)),

        'markdown-operate': fileURLToPath(new URL('../../blocknote/markdown-operate/src', import.meta.url)),
        'custom-blocknote-checklist': fileURLToPath(new URL('../../blocknote/custom-blocknote/checklist/src', import.meta.url)),
        'custom-blocknote-speaker': fileURLToPath(new URL('../../blocknote/custom-blocknote/speaker/src', import.meta.url)),
        'custom-blocknote-gradient-styles': fileURLToPath(new URL('../../blocknote/custom-blocknote/gradient-styles/src', import.meta.url)),
        'custom-blocknote-markdown-extensions': fileURLToPath(new URL('../../blocknote/custom-blocknote/markdown-extensions/src', import.meta.url)),
        'notify': fileURLToPath(new URL('../notify/src', import.meta.url)),
      },
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },

    base: './',
    build: {
      outDir: './dist',
    },
    server: {
      port: 5180,
      host: '::',
    },
  }
})
