// --- UI Primitives ---
import { Spacer } from "tiptap-styles/ui"
import {
  ToolbarGroup,
  ToolbarSeparator
} from "tiptap-styles/ui"

// --- Tiptap Node ---
import "tiptap-comment/index.css"
import "tiptap-trigger/index.css"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover, ColorHighlightPopoverButton
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover, LinkButton
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"
import { OperateTestDropdownMenu } from "@/components/my-ui/operate-test-dropdown-menu"
import type { OperateTestSuite } from "@/features/operate-tests"
import { CommentSidebar } from "tiptap-comment/react"

// --- Components ---
import { ThemeToggle } from "@/components/playground/theme-toggle"

import { CommentStore } from "tiptap-comment"
import { SelectionTestButton } from '@/components/my-ui/selection-test-button'
import { ScrollTestButton } from '@/components/my-ui/scroll-test-button'
import { OutlineButton } from '@/components/tiptap-ui/outline-button'


export const HeaderToolbar = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  commentStore,
  operateSuites,
  onRunAllOperateTests,
  onRunOperateSuite,
  operateTestsRunning = false,
  operateTestsDisabled = false,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  commentStore: CommentStore
  operateSuites?: OperateTestSuite[]
  onRunAllOperateTests?: () => void
  onRunOperateSuite?: (suiteId: string) => void
  operateTestsRunning?: boolean
  operateTestsDisabled?: boolean
}) => {

  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={ [1, 2, 3, 4] } portal={ isMobile } />
        <ListDropdownMenu
          types={ ["bulletList", "orderedList", "taskList"] }
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
        { !isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={ onHighlighterClick } />
        ) }
        { !isMobile ? <LinkPopover /> : <LinkButton onClick={ onLinkClick } /> }
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
        <CommentSidebar commentStore={ commentStore } />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <OperateTestDropdownMenu
          suites={ operateSuites }
          portal={ isMobile }
          onRunAll={ onRunAllOperateTests }
          onRunSuite={ onRunOperateSuite }
          running={ operateTestsRunning }
          disabled={ operateTestsDisabled }
        />
        <SelectionTestButton />
        <ScrollTestButton />

        <OutlineButton />
      </ToolbarGroup>

      <Spacer />

      { isMobile && <ToolbarSeparator /> }

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}