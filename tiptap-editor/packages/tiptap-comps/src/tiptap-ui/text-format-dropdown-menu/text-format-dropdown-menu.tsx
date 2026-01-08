import type { Editor } from '@tiptap/react'

// --- UI Primitives ---
import type { ButtonProps } from '../../ui'
import { forwardRef, useCallback, useState } from 'react'

// --- Hooks ---
import { useTiptapEditor } from 'tiptap-api/react'
// --- Icons ---
import {
  ChevronDownIcon,
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
import { HeadingButton } from '../heading-button'
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
  headingLevels?: (1 | 2 | 3)[]
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
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const { isVisible, isActive, canToggle } = useTextFormatDropdownMenu({
      editor,
      headingLevels,
      listTypes,
      hideWhenUnavailable,
    })

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

    return (
      <DropdownMenu modal open={ isOpen } onOpenChange={ handleOpenChange }>
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
            aria-label="文本格式"
            aria-pressed={ isActive }
            tooltip="文本格式"
            { ...buttonProps }
            ref={ ref }
          >
            <TextFormatIcon className="tiptap-button-icon" />
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" portal={ portal }>
          <Card>
            <CardBody>
              <ButtonGroup>
                {/* 标题 */}
                {headingLevels.map(level => (
                  <DropdownMenuItem key={ `heading-${level}` } asChild>
                    <HeadingButton
                      editor={ editor }
                      level={ level }
                      text={ `H${level}` }
                      showTooltip={ false }
                    />
                  </DropdownMenuItem>
                ))}

                {/* 列表 */}
                {listTypes.includes('orderedList') && (
                  <DropdownMenuItem key="orderedList" asChild>
                    <ListButton
                      editor={ editor }
                      type="orderedList"
                      text="有序列表"
                      showTooltip={ false }
                    />
                  </DropdownMenuItem>
                )}
                {listTypes.includes('bulletList') && (
                  <DropdownMenuItem key="bulletList" asChild>
                    <ListButton
                      editor={ editor }
                      type="bulletList"
                      text="无序列表"
                      showTooltip={ false }
                    />
                  </DropdownMenuItem>
                )}
                {listTypes.includes('taskList') && (
                  <DropdownMenuItem key="taskList" asChild>
                    <ListButton
                      editor={ editor }
                      type="taskList"
                      text="任务"
                      showTooltip={ false }
                    />
                  </DropdownMenuItem>
                )}

                {/* 引用 */}
                <DropdownMenuItem asChild>
                  <BlockquoteButton
                    editor={ editor }
                    text="引用"
                    showTooltip={ false }
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
