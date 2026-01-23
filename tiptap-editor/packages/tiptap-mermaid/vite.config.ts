import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' with { type: 'json' }
import basePkg from '../../package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
    }),
  ],

  build: {
    outDir: './dist',
    cssCodeSplit: true,
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        style: fileURLToPath(new URL('./src/index.css', import.meta.url)),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs'
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
          // 将 style.css 重命名为 index.css 以匹配 package.json
          if (assetInfo.names && assetInfo.names.some(name => name.endsWith('.css'))) {
            return 'index.css'
          }
          return '[name][extname]'
        },
      },
    },
  },
})
