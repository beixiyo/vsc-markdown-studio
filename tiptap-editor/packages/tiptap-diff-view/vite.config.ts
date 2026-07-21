import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import basePkg from '../../package.json' with { type: 'json' }
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    dts({ tsconfigPath: './tsconfig.json' }),
  ],
  build: {
    outDir: './dist',
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        react: fileURLToPath(new URL('./src/react/index.ts', import.meta.url)),
        i18n: fileURLToPath(new URL('./src/i18n/index.ts', import.meta.url)),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const extension = format === 'es'
          ? 'js'
          : 'cjs'
        return entryName === 'index'
          ? `index.${extension}`
          : `${entryName}/index.${extension}`
      },
    },
    rollupOptions: {
      external: (id) => {
        const dependencies = [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.peerDependencies || {}),
          ...Object.keys(basePkg.dependencies || {}),
        ]
        return dependencies.some(dependency => id === dependency || id.startsWith(`${dependency}/`))
      },
    },
  },
})
