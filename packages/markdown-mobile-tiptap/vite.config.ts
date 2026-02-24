import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        notify: fileURLToPath(new URL('../notify/src', import.meta.url)),
        styles: fileURLToPath(new URL('../styles', import.meta.url)),
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
      port: 5181,
      host: '::',
    },
  }
})
