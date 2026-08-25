import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'notify': fileURLToPath(new URL('../notify/src', import.meta.url)),
      'tiptap-api/react': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-api/src/react/index.ts', import.meta.url)),
      'tiptap-api': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-api/src/index.ts', import.meta.url)),
      'tiptap-diff': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-diff/src/index.ts', import.meta.url)),
      'tiptap-region': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-region/src/index.ts', import.meta.url)),
      'tiptap-nodes/ctx-ref': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-nodes/src/ctx-ref/index.ts', import.meta.url)),
      'tiptap-nodes/gradient-highlight': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-nodes/src/gradient-highlight/index.ts', import.meta.url)),
      'tiptap-nodes/speaker': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-nodes/src/speaker/index.ts', import.meta.url)),
      'tiptap-nodes/code-block': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-nodes/src/code-block/index.ts', import.meta.url)),
      'tiptap-editor-core': fileURLToPath(new URL('../../tiptap-editor/packages/tiptap-editor-core/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
  },
})
