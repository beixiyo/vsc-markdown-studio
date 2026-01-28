import {
  Spacer,
  Toolbar,
} from 'comps'
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

      <Toolbar.Group>
        <OutlineButton />
      </Toolbar.Group>

      <Toolbar.Group>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </Toolbar.Group>

      <Toolbar.Separator />

      <Toolbar.Group>
        <TextFormatDropdownMenu
          headingLevels={ [1, 2, 3, 4] }
          listTypes={ ['bulletList', 'orderedList', 'taskList'] }
          portal={ isMobile }
        />
        <CodeBlockButton />
      </Toolbar.Group>

      <Toolbar.Separator />

      <Toolbar.Group>
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
      </Toolbar.Group>

      <Toolbar.Separator />

      <Toolbar.Group>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </Toolbar.Group>

      <Toolbar.Separator />

      <Toolbar.Group>
        <TextAlignDropdownMenu
          types={ ['left', 'center', 'right', 'justify'] }
          portal={ isMobile }
        />
      </Toolbar.Group>

      <Toolbar.Separator />

      <Toolbar.Group>
        <ImageUploadButton text="Add" />
      </Toolbar.Group>

      { children }

      <Spacer />

      { isMobile && <Toolbar.Separator /> }

      <Toolbar.Group>
        <ThemeToggle />
      </Toolbar.Group>
    </>
  )
}

export type HeaderToolbarProps = {
  onHighlighterClick?: () => void
  onLinkClick?: () => void
  isMobile?: boolean
}
& React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
