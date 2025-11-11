/**
 * @link https://www.blocknotejs.org/docs/features/custom-schemas/custom-blocks
 */
import { en } from '@blocknote/core/locales'
import { useCreateBlockNote } from '@blocknote/react'
import { getColor } from '@jl-org/tool'
import { createAIExtension } from 'custom-blocknote-ai'
import { ArrowBeautify, TimeInsert } from 'custom-blocknote-exts-basic'
import { memo, useRef } from 'react'
import { cn } from 'utils'
import { schema } from '@/blocknoteExts/schema'

import { TestPanel } from '@/test/TestPanel'

import { useClickSection, useHoverSection, useSetupMDBridge, useVSCode } from '../../hooks'
import { resolveUsers, useComment } from '../Comments'
import { Editor } from './Editor'

export const Document = memo<DocumentProps>((props) => {
  const {
    style,
    className,
  } = props

  const {
    doc,
    activeUser,
    setActiveUser,
    threadStore,
    provider,
  } = useComment()

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

    // ======================
    // * 评论功能
    // ======================
    resolveUsers,
    comments: {
      threadStore,
    },
    collaboration: {
      provider,
      fragment: doc.getXmlFragment('blocknote'),
      user: { color: getColor(), name: activeUser.username },
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

  useSetupMDBridge(editor)
  useVSCode()
  useHoverSection(editor)
  useClickSection(editor)

  return <div
    className={ cn(
      'DocumentContainer relative overflow-auto h-full',
      className,
    ) }
    style={ style }
    ref={ editorElRef }
  >
    <Editor
      editor={ editor }
      className="h-full"
      activeUser={ activeUser }
      setActiveUser={ setActiveUser }
    />

    <TestPanel />
  </div>
})

Document.displayName = 'Document'

export type DocumentProps = {

}
& React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
