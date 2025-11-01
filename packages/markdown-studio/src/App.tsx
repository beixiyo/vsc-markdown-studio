/**
 * @link https://www.blocknotejs.org/docs/features/custom-schemas/custom-blocks
 */

import { en } from '@blocknote/core/locales'
import { useCreateBlockNote } from '@blocknote/react'
import { useTheme } from 'hooks'
import { useRef } from 'react'
import { createAIExtension } from './blocknoteExts/AI/AIExtension'
import { ArrowBeautify } from './blocknoteExts/exts/ArrowBeautify'
import { TimeInsert } from './blocknoteExts/exts/TimeInsert'
import { schema } from './blocknoteExts/schema'
import { Editor } from './components/Editor/Editor'
import { useClickSection, useHoverSection, useNotify, useSetupMDBridge, useVSCode } from './hooks'
import { TestPanel } from './test/TestPanel'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import './styles/gradient.css'
import 'styles/index.css'

export default function App() {
  useTheme()

  // ======================
  // * Editor
  // ======================
  const editor = useCreateBlockNote({
    schema,
    dictionary: {
      ...en,
      placeholders: {
        ...en.placeholders,
        default: 'Start typing your story...',
        heading: 'Enter your title here',
        emptyDocument: 'Begin your document',
      },
      slash_menu: {
        ...en.slash_menu,
        paragraph: {
          ...en.slash_menu.paragraph,
          title: 'Text Block',
          subtext: 'Regular text content',
        },
      },
    },

    _tiptapOptions: {
      extensions: [ArrowBeautify],
    },
    extensions: [TimeInsert, createAIExtension()],

    pasteHandler: ({ event, editor, defaultPasteHandler }) => {
      /** 检查剪贴板是否包含纯文本 */
      if (event.clipboardData?.types.includes('text/plain')) {
        const plainText = event.clipboardData.getData('text/plain')

        /**
         * 将双换行符替换为两个段落分隔符，将单换行符替换为 Markdown 硬换行符
         * 这是一个更精细的处理，以区分段落与行内换行
         */
        const markdown = plainText.replace(/(?<!\n)\n(?!\n)/g, '  \n') // 将单换行转换为 Markdown 硬换行符
        editor.pasteMarkdown(markdown)

        /** 告知 Blocknote 粘贴事件已处理 */
        return true
      }

      /** 如果不是纯文本，回退到默认的粘贴处理程序 */
      return defaultPasteHandler()
    },
  })

  // ======================
  // * Hooks
  // ======================
  const editorElRef = useRef<HTMLDivElement>(null)
  const notifyFns = useNotify(editor, editorElRef)

  useSetupMDBridge(editor, notifyFns)
  useVSCode()
  useHoverSection(editor)
  useClickSection(editor)

  return (
    <div className="relative overflow-auto" ref={ editorElRef }>
      <Editor editor={ editor } className="h-full" />

      <TestPanel />
    </div>
  )
}
