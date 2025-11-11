import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({ tsconfigPath: './tsconfig.json' }),
  ],
  resolve: {
    alias: {
      '@blocknote/core': fileURLToPath(new URL('../../blocknote/core/src', import.meta.url)),
    },
  },

  build: {
    sourcemap: true,
    outDir: './dist',
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@blocknote/core', 'react', 'react-dom'],
    },
  },
})


