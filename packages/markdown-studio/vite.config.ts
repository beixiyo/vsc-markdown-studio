import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    codeInspectorPlugin({
      bundler: 'vite',
      editor: 'cursor',
    }),
    react(),
    AutoImport({
      imports: ['react', 'react-router-dom'],
      dts: './src/auto-imports.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // workspace 包路径别名
      'comps': fileURLToPath(new URL('../comps/src', import.meta.url)),
      'hooks': fileURLToPath(new URL('../hooks/src', import.meta.url)),
      'utils': fileURLToPath(new URL('../utils/src', import.meta.url)),
      'config': fileURLToPath(new URL('../config/src', import.meta.url)),
    },
  },
  base: './',
  build: {
    outDir: '../vsc-markdown-studio/webview',
  },
  server: {
    port: 5175,
  },
})
