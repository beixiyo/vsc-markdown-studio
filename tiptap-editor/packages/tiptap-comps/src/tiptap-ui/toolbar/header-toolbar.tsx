import {
  Spacer,
  ToolbarGroup,
  ToolbarSeparator,
} from '../../ui'
import {
  CodeBlockButton,
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ImageUploadButton,
  LinkButton,
  LinkPopover,
  MarkButton,
  OutlineButton,
  TextAlignDropdownMenu,
  TextFormatDropdownMenu,
  UndoRedoButton,
} from '../index'

import { ThemeToggle } from './theme-toggle'

export function HeaderToolbar(props: HeaderToolbarProps) {
  const {
    onHighlighterClick = () => { },
    onLinkClick = () => { },
    isMobile = false,
    children,
  } = props

  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <OutlineButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextFormatDropdownMenu
          headingLevels={ [1, 2, 3, 4] }
          listTypes={ ['bulletList', 'orderedList', 'taskList'] }
          portal={ isMobile }
        />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        { !isMobile
          ? (
              <ColorHighlightPopover />
            )
          : (
              <ColorHighlightPopoverButton onClick={ onHighlighterClick } />
            ) }
        { !isMobile
          ? <LinkPopover />
          : <LinkButton onClick={ onLinkClick } /> }
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignDropdownMenu
          types={ ['left', 'center', 'right', 'justify'] }
          portal={ isMobile }
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      { children }

      <Spacer />

      { isMobile && <ToolbarSeparator /> }

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

export type HeaderToolbarProps = {
  onHighlighterClick?: () => void
  onLinkClick?: () => void
  isMobile?: boolean
}
& React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
