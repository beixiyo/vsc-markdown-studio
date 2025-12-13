import {
  Spacer, ToolbarGroup, ToolbarSeparator,
  BlockquoteButton,
  CodeBlockButton,
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  HeadingDropdownMenu,
  ImageUploadButton,
  LinkButton,
  LinkPopover,
  ListDropdownMenu,
  MarkButton,
  OutlineButton,
  TextAlignButton,
  UndoRedoButton,
} from '../../index'

import { ThemeToggle } from './theme-toggle'

export function HeaderToolbar(props: HeaderToolbarProps) {
  const {
    onHighlighterClick = (() => { }),
    onLinkClick = (() => { }),
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
        <HeadingDropdownMenu levels={ [1, 2, 3, 4] } portal={ isMobile } />
        <ListDropdownMenu
          types={ ['bulletList', 'orderedList', 'taskList'] }
          portal={ isMobile }
        />
        <BlockquoteButton />
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
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
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