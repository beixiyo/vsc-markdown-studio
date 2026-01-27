import type { Editor } from '@tiptap/react'
// --- UI Primitives ---
import type { ButtonProps } from '../../ui'

import { useCallback, useState } from 'react'

// --- Hooks ---
import { useTiptapEditor, useToolbarLabels } from 'tiptap-api/react'

// --- Icons ---
import { ChevronDownIcon } from '../../icons'

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
// --- Tiptap UI ---
import { type TextAlign, TextAlignButton } from '../text-align-button'
import { useTextAlignDropdownMenu } from './use-text-align-dropdown-menu'

export interface TextAlignDropdownMenuProps
  extends Omit<ButtonProps, 'type'> {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor
  /**
   * The text align types to display in the dropdown.
   */
  types?: TextAlign[]
  /**
   * Whether the dropdown should be hidden when no text align types are available
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback for when the dropdown opens or closes
   */
  onOpenChange?: (isOpen: boolean) => void
  /**
   * Whether to render the dropdown menu in a portal
   * @default false
   */
  portal?: boolean
}

export function TextAlignDropdownMenu({
  editor: providedEditor,
  types = ['left', 'center', 'right', 'justify'],
  hideWhenUnavailable = false,
  onOpenChange,
  portal = false,
  ...props
}: TextAlignDropdownMenuProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const toolbarLabels = useToolbarLabels()
  const [isOpen, setIsOpen] = useState(false)

  const { filteredAligns, canToggle, isActive, isVisible, Icon }
    = useTextAlignDropdownMenu({
      editor,
      types,
      hideWhenUnavailable,
    })

  const handleOnOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)
    },
    [onOpenChange],
  )

  if (!isVisible) {
    return null
  }

  return (
    <DropdownMenu open={ isOpen } onOpenChange={ handleOnOpenChange }>
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
          aria-label={ toolbarLabels.textAlign }
          tooltip={ toolbarLabels.textAlign }
          { ...props }
        >
          <Icon className="size-4" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" portal={ portal }>
        <Card>
          <CardBody>
            <ButtonGroup className="min-w-[10rem]">
              {filteredAligns.map(option => (
                <DropdownMenuItem key={ option.align } asChild>
                  <TextAlignButton
                    editor={ editor }
                    align={ option.align }
                    text={ option.label }
                    hideWhenUnavailable={ false }
                    showShortcut={ false }
                    showTooltip={ false }
                    className="w-full justify-start"
                  />
                </DropdownMenuItem>
              ))}
            </ButtonGroup>
          </CardBody>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TextAlignDropdownMenu
