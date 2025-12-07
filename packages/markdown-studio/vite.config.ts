import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
import { autoParseStyles } from '@jl-org/js-to-style'

export default defineConfig(({ command }) => {
  return {
    plugins: [
      codeInspectorPlugin({
        bundler: 'vite',
        editor: 'cursor',
      }),
      react(),
      AutoImport({
        imports: ['react', 'react-router-dom'],
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

        ...(command === 'serve' && {
          'comps/index.css': fileURLToPath(new URL('../comps/dist/index.css', import.meta.url)),
          'comps': fileURLToPath(new URL('../comps/src', import.meta.url)),
          'hooks': fileURLToPath(new URL('../hooks/src', import.meta.url)),
          'utils': fileURLToPath(new URL('../utils/src', import.meta.url)),

          '@blocknote/core': fileURLToPath(new URL('../../blocknote/core/src', import.meta.url)),
          '@blocknote/react': fileURLToPath(new URL('../../blocknote/react/src', import.meta.url)),
          '@blocknote/code-block': fileURLToPath(new URL('../../blocknote/code-block/src', import.meta.url)),
          '@blocknote/mantine': fileURLToPath(new URL('../../blocknote/mantine/src', import.meta.url)),

          'custom-blocknote-ai': fileURLToPath(new URL('../../custom-blocknote/ai/src', import.meta.url)),
          'custom-blocknote-mermaid': fileURLToPath(new URL('../../custom-blocknote/mermaid/src', import.meta.url)),
          'custom-blocknote-gradient-styles': fileURLToPath(new URL('../../custom-blocknote/gradient-styles/src', import.meta.url)),
          'custom-blocknote-exts-basic': fileURLToPath(new URL('../../custom-blocknote/exts-basic/src', import.meta.url)),
          'custom-blocknote-speaker': fileURLToPath(new URL('../../custom-blocknote/speaker/src', import.meta.url)),
        })
      },
    },
    base: './',
    build: {
      outDir: '../vsc-markdown-studio/webview',
    },
    server: {
      port: 5175,
      host: '::'
    },
  }
})
