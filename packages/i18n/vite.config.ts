import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
      outDir: './dist',
      include: ['src/**/*'],
      entryRoot: 'src',
    }),
  ],
  build: {
    outDir: './dist',
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const extension = format === 'cjs'
          ? 'cjs'
          : 'js'
        return `${entryName}.${extension}`
      },
    },
    rollupOptions: {
      external: (id) => {
        /** 匹配所有依赖包及其子路径 */
        const allDeps = [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys((pkg as any).devDependencies || {}),
        ]
        return allDeps.some(dep => id === dep || id.startsWith(`${dep}/`))
      },
    },
  },
})
