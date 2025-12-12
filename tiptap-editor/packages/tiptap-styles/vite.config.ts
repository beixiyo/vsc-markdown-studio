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
        icons: fileURLToPath(new URL('./src/icons/index.ts', import.meta.url)),
        styles: fileURLToPath(new URL('./src/styles/index.scss', import.meta.url)),
        'tiptap-node': fileURLToPath(new URL('./src/tiptap-node/index.ts', import.meta.url)),
        ui: fileURLToPath(new URL('./src/ui/index.ts', import.meta.url)),
        utils: fileURLToPath(new URL('./src/utils/index.ts', import.meta.url)),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs'
        return `${entryName}/index.${ext}`
      },
    },
    rollupOptions: {
      external: (id) => {
        const allDeps = [
          ...Object.keys(pkg.peerDependencies || {}),
        ]
        // NOTE: tiptap pm 必须是单实例，所以不能外部化
        return allDeps.some((dep) => id === dep) || id.includes('@tiptap')
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
