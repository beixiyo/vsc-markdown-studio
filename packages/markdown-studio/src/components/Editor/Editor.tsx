import type { BlockNoteEditor } from '@blocknote/core'
import type { MyUserType } from '../Comments'
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
import { AIMenuItem } from 'custom-blocknote-ai'
import { MermaidMenuItem } from 'custom-blocknote-mermaid'
import { memo } from 'react'
import { cn } from 'utils'
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
  editor: BlockNoteEditor<any, any, any>
  activeUser: MyUserType
  setActiveUser: (user: MyUserType) => void
} & React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
