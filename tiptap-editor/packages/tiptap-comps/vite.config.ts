import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' with { type: 'json' }
import basePkg from '../../package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    dts({ tsconfigPath: './tsconfig.json' })
  ],

  build: {
    cssCodeSplit: true,
    outDir: './dist',
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        icons: fileURLToPath(new URL('./src/icons/index.ts', import.meta.url)),
        style: fileURLToPath(new URL('./src/index.css', import.meta.url)),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs'
        if (entryName === 'icons') {
          return `icons/index.${ext}`
        }
        return `${entryName}.${ext}`
      },
    },
    rollupOptions: {
      external: (id) => {
        if (/\.(css|scss|sass|less)$/.test(id)) {
          return false
        }
        const allDeps = [
          ...Object.keys(pkg.peerDependencies || {}),
          ...Object.keys(basePkg.dependencies || {}),
        ]
        return allDeps.some(dep => id === dep || id.startsWith(`${dep}/`)) || id.includes('@tiptap/')
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names && assetInfo.names.some(name => name.endsWith('.css'))) {
            return 'index.css'
          }
          return '[name][extname]'
        },
      },
    },
  },
})
