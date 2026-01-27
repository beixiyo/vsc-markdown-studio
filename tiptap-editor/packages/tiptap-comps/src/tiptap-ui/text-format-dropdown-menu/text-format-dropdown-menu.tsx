import type { Editor } from '@tiptap/react'

// --- UI Primitives ---
import type { ButtonProps } from '../../ui'
import { forwardRef, useCallback, useEffect, useState } from 'react'

// --- Hooks ---
import { useBlockLabels, useHeadingLabels, useListLabels, useTiptapEditor, useToolbarLabels } from 'tiptap-api/react'
// --- Icons ---
import {
  ChevronDownIcon,
  HeadingFiveIcon,
  HeadingFourIcon,
  HeadingOneIcon,
  HeadingSixIcon,
  HeadingThreeIcon,
  HeadingTwoIcon,
  TextFormatIcon,
} from '../../icons'

import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui'
import { BlockquoteButton } from '../blockquote-button'
// --- Tiptap UI ---
import { HeadingButton, type Level } from '../heading-button'
import { ListButton } from '../list-button'
import { useTextFormatDropdownMenu } from './use-text-format-dropdown-menu'

export interface TextFormatDropdownMenuProps
  extends Omit<ButtonProps, 'type'> {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Available heading levels to show in the dropdown
   * @default [1, 2, 3]
   */
  headingLevels?: Level[]
  /**
   * Available list types to show in the dropdown
   * @default ['bulletList', 'orderedList', 'taskList']
   */
  listTypes?: ('bulletList' | 'orderedList' | 'taskList')[]
  /**
   * Whether the dropdown should hide when formats are not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Whether to render the dropdown menu in a portal
   * @default false
   */
  portal?: boolean
  /**
   * Callback for when the dropdown opens or closes
   */
  onOpenChange?: (isOpen: boolean) => void
}

/**
 * Dropdown menu component for selecting text formats (headings, paragraph, lists, blockquote) in a Tiptap editor.
 */
export const TextFormatDropdownMenu = forwardRef<
  HTMLButtonElement,
  TextFormatDropdownMenuProps
>(
  (
    {
      editor: providedEditor,
      headingLevels = [1, 2, 3],
      listTypes = ['bulletList', 'orderedList', 'taskList'],
      hideWhenUnavailable = false,
      portal = false,
      onOpenChange,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const toolbarLabels = useToolbarLabels()
    const listLabels = useListLabels()
    const blockLabels = useBlockLabels()
    const headingLabels = useHeadingLabels()
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const {
      isVisible,
      isActive,
      canToggle,
      activeType,
      activeHeadingLevel,
    } = useTextFormatDropdownMenu({
      editor,
      headingLevels,
      listTypes,
      hideWhenUnavailable,
    })

    const [lastTextIcon, setLastTextIcon] = useState<React.ElementType>(TextFormatIcon)

    useEffect(() => {
      if (activeType === 'paragraph') {
        setLastTextIcon(TextFormatIcon)
      }
      else if (activeType === 'heading' && activeHeadingLevel) {
        const iconMap: Record<number, React.ElementType> = {
          1: HeadingOneIcon,
          2: HeadingTwoIcon,
          3: HeadingThreeIcon,
          4: HeadingFourIcon,
          5: HeadingFiveIcon,
          6: HeadingSixIcon,
        }
        setLastTextIcon(iconMap[activeHeadingLevel] || TextFormatIcon)
      }
    }, [activeType, activeHeadingLevel])

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!editor || !canToggle)
          return
        setIsOpen(open)
        onOpenChange?.(open)
      },
      [canToggle, editor, onOpenChange],
    )

    if (!isVisible) {
      return null
    }

    const MainIcon = lastTextIcon

    return (
      <DropdownMenu modal={ false } open={ isOpen } onOpenChange={ handleOpenChange }>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            data-active-state={ isActive
              ? 'on'
              : 'off' }
            role="button"
            tabIndex={ -1 }
            disabled={ !canToggle }
            data-disabled={ !canToggle }
            aria-label={ toolbarLabels.textFormat }
            aria-pressed={ isActive }
            tooltip={ toolbarLabels.textFormat }
            { ...buttonProps }
            ref={ ref }
          >
            <MainIcon className="size-4" />
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" portal={ portal }>
          <Card>
            <CardBody>
              <ButtonGroup className="min-w-[12rem]">
                {/* 标题 */ }
                { headingLevels.map(level => (
                  <DropdownMenuItem key={ `heading-${level}` } asChild>
                    <HeadingButton
                      editor={ editor }
                      level={ level }
                      text={ headingLabels[`heading${level}` as keyof typeof headingLabels] }
                      showTooltip={ false }
                      className="w-full justify-start"
                    />
                  </DropdownMenuItem>
                )) }

                {/* 正文 */ }
                <DropdownMenuItem asChild>
                  <Button
                    type="button"
                    data-style="ghost"
                    data-active-state={ activeType === 'paragraph'
                      ? 'on'
                      : 'off' }
                    role="button"
                    tabIndex={ -1 }
                    aria-label={ headingLabels.paragraph }
                    aria-pressed={ activeType === 'paragraph' }
                    tooltip={ headingLabels.paragraph }
                    showTooltip={ false }
                    onClick={ () => editor?.chain().focus().setParagraph().run() }
                    className="w-full justify-start"
                  >
                    <TextFormatIcon className="size-4" />
                    <span className="tiptap-button-text">{ headingLabels.paragraph }</span>
                  </Button>
                </DropdownMenuItem>

                {/* 列表 */ }
                { listTypes.includes('orderedList') && (
                  <DropdownMenuItem key="orderedList" asChild>
                    <ListButton
                      editor={ editor }
                      type="orderedList"
                      text={ listLabels.orderedList }
                      showTooltip={ false }
                      className="w-full justify-start"
                    />
                  </DropdownMenuItem>
                ) }
                { listTypes.includes('bulletList') && (
                  <DropdownMenuItem key="bulletList" asChild>
                    <ListButton
                      editor={ editor }
                      type="bulletList"
                      text={ listLabels.bulletList }
                      showTooltip={ false }
                      className="w-full justify-start"
                    />
                  </DropdownMenuItem>
                ) }
                { listTypes.includes('taskList') && (
                  <DropdownMenuItem key="taskList" asChild>
                    <ListButton
                      editor={ editor }
                      type="taskList"
                      text={ listLabels.taskList }
                      showTooltip={ false }
                      className="w-full justify-start"
                    />
                  </DropdownMenuItem>
                ) }

                {/* 引用 */ }
                <DropdownMenuItem asChild>
                  <BlockquoteButton
                    editor={ editor }
                    text={ blockLabels.blockquote }
                    showTooltip={ false }
                    className="w-full justify-start"
                  />
                </DropdownMenuItem>
              </ButtonGroup>
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
)

TextFormatDropdownMenu.displayName = 'TextFormatDropdownMenu'

export default TextFormatDropdownMenu
