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
    cssCodeSplit: false,
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      },
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: (id) => {
        const allDeps = [
          ...Object.keys(pkg.peerDependencies || {}),
          ...Object.keys(basePkg.dependencies || {}),
        ]
        return allDeps.some(dep => id === dep) || id.includes('@tiptap/')
      },
    },
  },
})

