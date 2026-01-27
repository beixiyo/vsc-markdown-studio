import type { Editor } from '@tiptap/react'
// --- UI Primitives ---
import { useCallback, useRef } from 'react'

// --- Hooks ---
import { useTiptapEditor, useToolbarLabels } from 'tiptap-api/react'

// --- Icons ---
import { ChevronDownIcon } from '../../icons'

import {
  Button,
  Card,
  Popover,
  type PopoverRef,
} from 'comps'
// --- Tiptap UI ---
import { type TextAlign, TextAlignButton } from '../text-align-button'
import { useTextAlignDropdownMenu } from './use-text-align-dropdown-menu'

export interface TextAlignDropdownMenuProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
  portal: _portal,
  ...props
}: TextAlignDropdownMenuProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const toolbarLabels = useToolbarLabels()
  const popoverRef = useRef<PopoverRef>(null)

  const { filteredAligns, canToggle, isActive, isVisible, Icon }
    = useTextAlignDropdownMenu({
      editor,
      types,
      hideWhenUnavailable,
    })

  const closePopover = useCallback(() => {
    popoverRef.current?.close()
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <Popover
      ref={ popoverRef }
      trigger="click"
      onOpen={ () => onOpenChange?.(true) }
      onClose={ () => onOpenChange?.(false) }
      content={
        <Card padding="none" shadow="md" className="min-w-[10rem] p-1">
          <div className="flex flex-col gap-0.5">
            {filteredAligns.map(option => (
              <TextAlignButton
                key={ option.align }
                editor={ editor }
                align={ option.align }
                text={ option.label }
                hideWhenUnavailable={ false }
                showShortcut={ false }
                className="w-full justify-start"
                onClick={ closePopover }
              />
            ))}
          </div>
        </Card>
      }
    >
      <Button
        type="button"
        variant="ghost"
        name={ isActive ? 'active' : undefined }
        role="button"
        tabIndex={ -1 }
        disabled={ !canToggle }
        aria-label={ toolbarLabels.textAlign }
        tooltip={ toolbarLabels.textAlign }
        { ...props }
        size="sm"
      >
        <Icon className="size-4" />
        <ChevronDownIcon className="tiptap-button-dropdown-small" />
      </Button>
    </Popover>
  )
}

export default TextAlignDropdownMenu
