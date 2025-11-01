import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({ tsconfigPath: './tsconfig.json' }),
  ],
  build: {
    outDir: './dist',
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@blocknote/react',
      ],
      output: {
        assetFileNames: (assetInfo) => {
          // 将 CSS 文件命名为 index.css
          if (assetInfo.name === 'style.css') {
            return 'index.css'
          }
          return assetInfo.name || 'asset'
        },
      },
    },
  },
})

