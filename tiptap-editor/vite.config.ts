import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const filename = fileURLToPath(new URL(import.meta.url).href)
const __dirname = dirname(filename)

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [
      codeInspectorPlugin({
        bundler: 'vite',
        editor: 'windsurf',
        hideConsole: true,
      }),
      react(),
      dts({ tsconfigPath: './tsconfig.app.json' }),
      /**
       * @link https://www.npmjs.com/package/react-devtools
       * ```bash
       * npm install -g react-devtools
       * react-devtools
       * ```
       */
      {
        name: 'react-devtools-inject',
        apply: 'serve', // 仅在开发服务器模式下应用
        transformIndexHtml(html) {
          return html.replace(
            '</head>',
            '<script src="http://localhost:8097"></script></head>',
          )
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        ...(command === 'serve' && {
          'tiptap-api/react': path.resolve(__dirname, './packages/tiptap-api/src/react/index.ts'),
          'tiptap-api': path.resolve(__dirname, './packages/tiptap-api/src/index.ts'),
          'tiptap-react-hook': path.resolve(__dirname, './packages/tiptap-react-hook/src/index.ts'),

          'tiptap-ai/index.css': path.resolve(__dirname, './packages/tiptap-ai/dist/index.css'),
          'tiptap-ai/react': path.resolve(__dirname, './packages/tiptap-ai/src/react//index.ts'),
          'tiptap-ai': path.resolve(__dirname, './packages/tiptap-ai/src/index.ts'),

          'tiptap-comment/index.css': path.resolve(__dirname, './packages/tiptap-comment/dist/index.css'),
          'tiptap-comment/react': path.resolve(__dirname, './packages/tiptap-comment/src/react/index.ts'),
          'tiptap-comment': path.resolve(__dirname, './packages/tiptap-comment/src/index.ts'),

          'tiptap-mermaid/react': path.resolve(__dirname, './packages/tiptap-mermaid/src/react/index.ts'),
          'tiptap-mermaid/index.css': path.resolve(__dirname, './packages/tiptap-mermaid/dist/index.css'),
          'tiptap-mermaid': path.resolve(__dirname, './packages/tiptap-mermaid/src/index.ts'),

          'tiptap-trigger/index.css': path.resolve(__dirname, './packages/tiptap-trigger/dist/index.css'),
          'tiptap-trigger/react': path.resolve(__dirname, './packages/tiptap-trigger/src/react/index.ts'),
          'tiptap-trigger': path.resolve(__dirname, './packages/tiptap-trigger/src/index.ts'),

          'tiptap-speaker-node': path.resolve(__dirname, './packages/tiptap-speaker-node/src/index.ts'),

          'tiptap-editor-core': path.resolve(__dirname, './packages/tiptap-editor-core/src/index.ts'),
        }),
      },
    },
    server: {
      host: '0.0.0.0',
    },
  }
})
