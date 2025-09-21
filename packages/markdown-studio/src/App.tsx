import { BlockNoteSchema, defaultBlockSpecs, defaultStyleSpecs, filterSuggestionItems } from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import {
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  GridSuggestionMenuController,
  SuggestionMenuController,
  useCreateBlockNote,
} from '@blocknote/react'
import { useTheme } from 'hooks'
import { useRef } from 'react'
import { MermaidBlock, mermaidMenuItem } from './blocknoteExts/mermaid'
import { CustomFormatToolbar } from './components/CustomFormatToolbar'
import { useNotify } from './hooks/useNotify'
import { useSetupMDBridge } from './hooks/useSetupMDBridge'
import { useVSCode } from './hooks/useVSCode'
import { TestPanel } from './test/TestPanel'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

export default function App() {
  useTheme()

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      mermaid: MermaidBlock,
    },
    styleSpecs: {
      ...defaultStyleSpecs,
    },
  })

  const editor = useCreateBlockNote({
    schema,
    initialContent: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '欢迎使用 Markdown 编辑器',
            styles: {},
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '这是一个基于 BlockNote 的标准 Markdown 编辑器，支持常见的 Markdown 语法。',
            styles: {},
          },
        ],
      },
    ],
  })

  const editorElRef = useRef<HTMLDivElement>(null)
  const notifyFns = useNotify(editor, editorElRef)
  useSetupMDBridge(editor, notifyFns)
  useVSCode()

  return <div
    className="w-full bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50"
    ref={ editorElRef }
  >
    <BlockNoteView
      className="!rounded-none"
      editor={ editor }
      emojiPicker={ false }
      slashMenu={ false }
      formattingToolbar={ false }
    >
      <FormattingToolbarController
        formattingToolbar={ CustomFormatToolbar }
      />

      <SuggestionMenuController
        triggerCharacter="/"
        getItems={ async (query: string) => {
          const items = [
            ...getDefaultReactSlashMenuItems(editor),
            mermaidMenuItem(),
          ] as any[]
          return filterSuggestionItems(items, query)
        } }
      />

      <GridSuggestionMenuController
        triggerCharacter=":"
        columns={ 5 }
        minQueryLength={ 2 }
      />
    </BlockNoteView>
    <TestPanel />
  </div>
}
