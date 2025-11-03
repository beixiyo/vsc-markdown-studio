import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import { useRef, useEffect } from 'react'
import { BlockNoteSchema } from '@blocknote/core'
import { GradientStyles } from 'custom-blocknote-gradient-styles'
import { createSpeaker } from 'custom-blocknote-speaker'
import { useSetupMDBridge } from './hooks/useSetupMDBridge'
import './styles/index.scss'
import { useTheme } from 'hooks'
import { useNotify, notifyNative } from 'notify'

export default function App() {
  const editor = useCreateBlockNote({
    schema: BlockNoteSchema.create().extend({
      inlineContentSpecs: {
        speaker: createSpeaker(speaker => {
          notifyNative('speakerTapped', speaker)
        }),
      },
      styleSpecs: {
        gradient: GradientStyles,
      },
    }),
  })

  const [theme] = useTheme()
  const editorElRef = useRef<HTMLDivElement>(null)

  useSetupMDBridge(editor)
  const { notifyBlockTypeChanged } = useNotify(editor, editorElRef)

  // 监听内容变化
  useEffect(() => {
    if (!editor) return

    const unsubscribe = editor.onChange(() => {
      const markdown = editor.blocksToMarkdownLossy()
      notifyNative('contentChanged', markdown)
      console.log('contentChanged\n', markdown)
      notifyBlockTypeChanged()
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [editor, notifyBlockTypeChanged])

  // 监听块类型变化（选择变化时）
  useEffect(() => {
    if (!editor) return

    const unsubscribe = editor.onSelectionChange(() => {
      notifyBlockTypeChanged()
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [editor, notifyBlockTypeChanged])

  return (
    <div ref={ editorElRef }>
      <BlockNoteView
        className='markdown-body'
        theme={ theme }
        editor={ editor }
        formattingToolbar={ false }
        slashMenu={ false }
        sideMenu={ false }
        emojiPicker={ false }
      />
    </div>
  )
}
