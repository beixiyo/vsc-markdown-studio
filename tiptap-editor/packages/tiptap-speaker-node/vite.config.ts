import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
    }),
  ],

  build: {
    outDir: './dist',
    cssCodeSplit: false,
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs'
        if (entryName === 'react') {
          return `react/index.${ext}`
        }
        return `${entryName}.${ext}`
      },
    },
    rollupOptions: {
      external: (id) => {
        const allDeps = [
          ...Object.keys(pkg.peerDependencies || {}),
          ...Object.keys(pkg.devDependencies || {}),
        ]
        return allDeps.some((dep) => id === dep || id.startsWith(dep)) || id.includes('@tiptap')
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

