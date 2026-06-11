import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const filename = fileURLToPath(new URL(import.meta.url).href)
const __dirname = dirname(filename)

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      codeInspectorPlugin({
        bundler: 'vite',
        /**
         * @link https://inspector.fe-dev.cn/en/more/question.html#using-in-wsl-or-dev-containers
         *
         * VSCode / Cursor:
         * ```bash
         * # 只有 WSL 才需要设置
         * echo "CODE_EDITOR=$(which code)" > .env.local
         * ```
         *
         * Neovim（open-nvim）：
         * ```bash
         * echo "CODE_EDITOR=$(realpath ~/.local/bin/open-nvim)" > .env.local
         * ```
         */
        editor: `${process.env.HOME}/.local/bin/open-nvim` as any,
        pathFormat: ['{file}', '{line}', '{column}'],
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
        apply: 'serve',
        transformIndexHtml(html) {
          return html.replace(
            '</head>',
            '<script src="http://localhost:8097"></script></head>',
          )
        },
      },
    ],
    resolve: {
      tsconfigPaths: true,
      alias: {
        'tiptap-ai/index.css': path.resolve(__dirname, './packages/tiptap-ai/dist/index.css'),
        'tiptap-comment/index.css': path.resolve(__dirname, './packages/tiptap-comment/dist/index.css'),
        'tiptap-mermaid/index.css': path.resolve(__dirname, './packages/tiptap-mermaid/dist/index.css'),
        'tiptap-trigger/index.css': path.resolve(__dirname, './packages/tiptap-trigger/dist/index.css'),
        'tiptap-comps/index.css': path.resolve(__dirname, './packages/tiptap-comps/dist/index.css'),
        'comps/index.css': path.resolve(__dirname, '../packages/comps/dist/index.css'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5367,
    },
  }
})
