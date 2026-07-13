import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    outDir: './dist',
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es'
        ? 'js'
        : 'cjs'}`,
    },
    rollupOptions: {
      external: id => Object.keys(pkg.peerDependencies || {})
        .some(dep => id === dep || id.startsWith(`${dep}/`)),
      output: {
        assetFileNames: 'index.css',
      },
    },
  },
})
