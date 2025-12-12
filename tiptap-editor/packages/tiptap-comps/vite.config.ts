import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    dts({ tsconfigPath: './tsconfig.json' })
  ],

  build: {
    outDir: './dist',
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: (id) => {
        const allDeps = [
          ...Object.keys(pkg.peerDependencies || {}),
        ]
        return allDeps.some(dep => id === dep || id.startsWith(dep))
      },
      output: {
        assetFileNames: (assetInfo) => {
          const isCss = assetInfo.names.some(name => name.endsWith('.css'))
          if (isCss) {
            return 'index.css'
          }
          return '[name][extname]'
        },
      },
    },
  },
})