import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'notify': fileURLToPath(new URL('../notify/src', import.meta.url)),
        'tiptap-editor-core': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-editor-core/src', import.meta.url)),
        'tiptap-nodes/gradient-highlight': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-nodes/src/gradient-highlight/index.ts', import.meta.url)),
        'tiptap-nodes/speaker': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-nodes/src/speaker/index.ts', import.meta.url)),
        'tiptap-nodes/code-block': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-nodes/src/code-block/index.ts', import.meta.url)),
      },
    },
    esbuild: {
      drop: mode === 'production'
        ? ['console', 'debugger']
        : [],
    },
    base: './',
    build: { outDir: './dist' },
    server: { port: 5181, host: '::' },
  }
})
