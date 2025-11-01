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
import { AIMenuItem } from '@/blocknoteExts/AI/AIMenuItem'
import { MermaidMenuItem } from '@/blocknoteExts/blocks/mermaid'
import { AIMenu } from '../AIMenu'
import { DragHandleMenu } from '../DragHandleMenu'
import { FormatToolbar } from '../Toolbar'
import './editor.scss'

export const Editor = memo<EditorProps>((props) => {
  const {
    style,
    className,
    editor,
  } = props

  return <BlockNoteView
    className={ cn(
      'overflow-y-auto',
      className,
    ) }
    style={ style }
    editor={ editor }
    emojiPicker={ false }
    slashMenu={ false }
    formattingToolbar={ false }
    sideMenu={ false }
  >
    <SideMenuController
      sideMenu={ sideMenuProps => <SideMenu
        { ...sideMenuProps }
        dragHandleMenu={ DragHandleMenu }
      /> }
    />
    <FormattingToolbarController
      formattingToolbar={ FormatToolbar }
    />

    <SuggestionMenuController
      triggerCharacter="/"
      getItems={ async (query: string) => {
        return filterSuggestionItems([
          ...getDefaultReactSlashMenuItems(editor),
          AIMenuItem(editor),
          MermaidMenuItem(editor),
        ], query) as any[]
      } }
    />

    <GridSuggestionMenuController
      triggerCharacter=":"
      columns={ 5 }
      minQueryLength={ 2 }
    />

    <AIMenu />
  </BlockNoteView>
})

Editor.displayName = 'Editor'

export type EditorProps = {
  editor: BlockNoteEditor<any>
} & React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
