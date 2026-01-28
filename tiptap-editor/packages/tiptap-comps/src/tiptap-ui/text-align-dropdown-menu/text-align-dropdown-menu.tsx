import type { Editor } from '@tiptap/react'
// --- Tiptap UI ---
import type { TextAlign } from '../text-align-button/use-text-align'

import {
  Button,
  Cascader,
  type CascaderOption,
  type CascaderRef,
} from 'comps'

// --- UI Primitives ---
import { useCallback, useMemo, useRef } from 'react'

// --- Hooks ---
import { useTiptapEditor, useToolbarLabels } from 'tiptap-api/react'
// --- Icons ---
import { ChevronDownIcon } from '../../icons'
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
  const cascaderRef = useRef<CascaderRef>(null)

  const { filteredAligns, canToggle, isActive, isVisible, Icon, activeAlign }
    = useTextAlignDropdownMenu({
      editor,
      types,
      hideWhenUnavailable,
    })

  const options = useMemo<CascaderOption[]>(() => {
    return filteredAligns.map(option => ({
      value: option.align,
      label: option.label,
      icon: <option.icon className="size-4 text-icon" />,
    }))
  }, [filteredAligns])

  const handleValueChange = useCallback((value: string) => {
    editor?.chain().focus().setTextAlign(value).run()
  }, [editor])

  if (!isVisible) {
    return null
  }

  const trigger = useMemo(() => (
    <Button
      type="button"
      variant="ghost"
      name={ isActive
        ? 'active'
        : undefined }
      role="button"
      tabIndex={ -1 }
      disabled={ !canToggle }
      aria-label={ toolbarLabels.textAlign }
      tooltip={ toolbarLabels.textAlign }
      { ...props }
      size="sm"
    >
      <Icon className="size-4" />
      <ChevronDownIcon className="size-4 text-icon" />
    </Button>
  ), [isActive, canToggle, toolbarLabels.textAlign, Icon, props])

  return (
    <Cascader
      ref={ cascaderRef }
      options={ options }
      value={ activeAlign }
      onChange={ handleValueChange }
      onOpenChange={ onOpenChange }
      placement="bottom-start"
      dropdownHeight={ 400 }
      optionClassName="px-2 py-1"
      trigger={ trigger }
    />
  )
}

export default TextAlignDropdownMenu
