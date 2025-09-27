import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { autoParseStyles } from '@jl-org/js-to-style'

/** 这个配置文件只用于打包 React 组件库 */
export default defineConfig({
  plugins: [
    react(),
    dts({ tsconfigPath: './tsconfig.app.json' }),
    AutoImport({
      imports: ['react'],
      dts: './src/auto-imports.d.ts',
    }),
    autoParseStyles({
      jsPath: fileURLToPath(new URL('../styles/variable.ts', import.meta.url)),
      cssPath: fileURLToPath(new URL('../styles/css/autoVariables.css', import.meta.url)),
      scssPath: fileURLToPath(new URL('../styles/scss/autoVariables.scss', import.meta.url)),
      dev: true,
      build: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "styles/index.scss" as *;`,
      },
    },
  },

  build: {
    outDir: './dist',
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
})
