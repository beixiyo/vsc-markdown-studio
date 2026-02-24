import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import AutoImport from 'unplugin-auto-import/vite'
import tailwindcss from '@tailwindcss/vite'

const filename = fileURLToPath(new URL(import.meta.url).href)
const __dirname = dirname(filename)

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [
      codeInspectorPlugin({
        bundler: 'vite',
        hideConsole: true,
      }),
      react(),
      tailwindcss(),
      dts({ tsconfigPath: './tsconfig.app.json' }),
      AutoImport({
        imports: ['react'],
        dts: './src/auto-imports.d.ts',
      }),
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
        'tiptap-api/react': path.resolve(__dirname, './packages/tiptap-api/src/react/index.ts'),
        'tiptap-api': path.resolve(__dirname, './packages/tiptap-api/src/index.ts'),
        'tiptap-react-hook': path.resolve(__dirname, './packages/tiptap-react-hook/src/index.ts'),

        'tiptap-ai/index.css': path.resolve(__dirname, './packages/tiptap-ai/dist/index.css'),
        'tiptap-ai/react': path.resolve(__dirname, './packages/tiptap-ai/src/react/index.ts'),
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

        'tiptap-comps/index.css': path.resolve(__dirname, './packages/tiptap-comps/dist/index.css'),
        'tiptap-comps/icons': path.resolve(__dirname, './packages/tiptap-comps/src/icons/index.ts'),
        'tiptap-comps': path.resolve(__dirname, './packages/tiptap-comps/src/index.ts'),

        'tiptap-nodes/speaker': path.resolve(__dirname, './packages/tiptap-nodes/src/speaker/index.ts'),
        'tiptap-nodes/image-upload': path.resolve(__dirname, './packages/tiptap-nodes/src/image-upload/index.tsx'),
        'tiptap-nodes/horizontal-rule': path.resolve(__dirname, './packages/tiptap-nodes/src/horizontal-rule/index.ts'),
        'tiptap-nodes': path.resolve(__dirname, './packages/tiptap-nodes/src/index.ts'),

        'tiptap-utils': path.resolve(__dirname, './packages/tiptap-utils/src/index.ts'),

        'tiptap-editor-core': path.resolve(__dirname, './packages/tiptap-editor-core/src/index.ts'),

        'hooks': path.resolve(__dirname, '../packages/hooks/src/index.ts'),
        'i18n/react': path.resolve(__dirname, '../packages/i18n/react/index.ts'),
        'i18n': path.resolve(__dirname, '../packages/i18n/src/index.ts'),

        'comps/index.css': path.resolve(__dirname, '../packages/comps/dist/index.css'),
        'comps': path.resolve(__dirname, '../packages/comps/src/index.ts'),

        'utils': path.resolve(__dirname, '../packages/utils/src/index.ts'),

        ...(command === 'serve' && {

        }),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5367
    },
  }
})
