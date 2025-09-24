import type { BlockNoteEditor } from '@blocknote/core'
import { filterSuggestionItems } from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import {
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  GridSuggestionMenuController,
  SideMenu,
  SideMenuController,
  SuggestionMenuController,
} from '@blocknote/react'
import { memo } from 'react'
import { cn } from 'utils'
import { labelInputMenuItem } from '@/blocknoteExts/labelInput'
import { mermaidMenuItem } from '../blocknoteExts/mermaid'
import { CustomFormatToolbar } from './CustomFormatToolbar'
import { CustomDragHandleMenu } from './CustomDragHandleMenu'

export const Editor = memo<EditorProps>((props) => {
  const {
    style,
    className,
    editor,
  } = props

  return <div
    className={ cn(
      'h-full bg-white dark:bg-[#1F1F1F] overflow-y-auto',
      className,
    ) }
    style={ style }
  >
    <BlockNoteView
      className="!rounded-none min-h-screen"
      editor={ editor }
      emojiPicker={ false }
      slashMenu={ false }
      formattingToolbar={ false }
      sideMenu={ false }
    >
      <SideMenuController
        sideMenu={ sideMenuProps => <SideMenu
          { ...sideMenuProps }
          dragHandleMenu={ CustomDragHandleMenu } />
        }
      />
      <FormattingToolbarController
        formattingToolbar={ CustomFormatToolbar }
      />

      <SuggestionMenuController
        triggerCharacter="/"
        getItems={ async (query: string) => {
          return filterSuggestionItems([
            ...getDefaultReactSlashMenuItems(editor),
            labelInputMenuItem(),
            mermaidMenuItem(),
          ], query) as any[]
        } }
      />

      <GridSuggestionMenuController
        triggerCharacter=":"
        columns={ 5 }
        minQueryLength={ 2 }
      />
    </BlockNoteView>
  </div>
})

Editor.displayName = 'Editor'

export type EditorProps = {
  editor: BlockNoteEditor<any>
} & React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
