'use client'

import type { Editor } from '@tiptap/react'
import { useEffect, useMemo, useState } from 'react'

import { useAlignLabels, useTiptapEditor, useToolbarLabels } from 'tiptap-api/react'

import { isExtensionAvailable } from 'tiptap-config'

import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from '../../icons'
import {
  canSetTextAlign,
  isTextAlignActive,
  type TextAlign,
  textAlignIcons,
} from '../text-align-button/use-text-align'

/**
 * Configuration for the text align dropdown menu functionality
 */
export interface UseTextAlignDropdownMenuConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * The text align types to display in the dropdown.
   * @default ["left", "center", "right", "justify"]
   */
  types?: TextAlign[]
  /**
   * Whether the dropdown should be hidden when no text align types are available
   * @default false
   */
  hideWhenUnavailable?: boolean
}

export interface TextAlignOption {
  label: string
  align: TextAlign
  icon: React.ElementType
}

/**
 * 获取文本对齐选项（已废弃，请使用 useAlignLabels hook）
 * @deprecated 使用 useAlignLabels hook 替代
 */
export const textAlignOptions: TextAlignOption[] = [
  {
    label: 'Align left',
    align: 'left',
    icon: AlignLeftIcon,
  },
  {
    label: 'Align center',
    align: 'center',
    icon: AlignCenterIcon,
  },
  {
    label: 'Align right',
    align: 'right',
    icon: AlignRightIcon,
  },
  {
    label: 'Align justify',
    align: 'justify',
    icon: AlignJustifyIcon,
  },
]

export function canSetAnyTextAlign(
  editor: Editor | null,
  alignTypes: TextAlign[],
): boolean {
  if (!editor || !editor.isEditable)
    return false
  return alignTypes.some(align => canSetTextAlign(editor, align))
}

export function isAnyTextAlignActive(
  editor: Editor | null,
  alignTypes: TextAlign[],
): boolean {
  if (!editor || !editor.isEditable)
    return false
  return alignTypes.some(align => isTextAlignActive(editor, align))
}

export function getFilteredTextAlignOptions(
  availableTypes: TextAlign[],
  alignLabels: ReturnType<typeof useAlignLabels>,
): TextAlignOption[] {
  return textAlignOptions
    .filter(option => availableTypes.includes(option.align))
    .map(option => ({
      ...option,
      label: alignLabels[option.align],
    }))
}

export function shouldShowTextAlignDropdown(params: {
  editor: Editor | null
  alignTypes: TextAlign[]
  hideWhenUnavailable: boolean
  textAlignInSchema: boolean
  canSetAny: boolean
}): boolean {
  const { editor, hideWhenUnavailable, textAlignInSchema, canSetAny } = params

  if (!textAlignInSchema || !editor) {
    return false
  }

  if (hideWhenUnavailable && !editor.isActive('code')) {
    return canSetAny
  }

  return true
}

/**
 * Gets the currently active text align type from the available types
 */
export function getActiveTextAlignType(
  editor: Editor | null,
  availableTypes: TextAlign[],
): TextAlign | undefined {
  if (!editor || !editor.isEditable)
    return undefined
  return availableTypes.find(align => isTextAlignActive(editor, align))
}

/**
 * Custom hook that provides text align dropdown menu functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyTextAlignDropdown() {
 *   const {
 *     isVisible,
 *     activeAlign,
 *     isAnyActive,
 *     canSetAny,
 *     filteredAligns,
 *   } = useTextAlignDropdownMenu()
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <DropdownMenu>
 *       // dropdown content
 *     </DropdownMenu>
 *   )
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedTextAlignDropdown() {
 *   const {
 *     isVisible,
 *     activeAlign,
 *   } = useTextAlignDropdownMenu({
 *     editor: myEditor,
 *     types: ["left", "center", "right"],
 *     hideWhenUnavailable: true,
 *   })
 *
 *   // component implementation
 * }
 * ```
 */
export function useTextAlignDropdownMenu(
  config?: UseTextAlignDropdownMenuConfig,
) {
  const {
    editor: providedEditor,
    types = ['left', 'center', 'right', 'justify'],
    hideWhenUnavailable = false,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const alignLabels = useAlignLabels()
  const toolbarLabels = useToolbarLabels()
  const [isVisible, setIsVisible] = useState(true)

  const textAlignInSchema = isExtensionAvailable(editor, 'textAlign')

  const filteredAligns = useMemo(
    () => getFilteredTextAlignOptions(types, alignLabels),
    [types, alignLabels],
  )

  const canSetAny = canSetAnyTextAlign(editor, types)
  const isAnyActive = isAnyTextAlignActive(editor, types)
  const activeAlign = getActiveTextAlignType(editor, types)
  const activeOption = filteredAligns.find(
    option => option.align === activeAlign,
  )

  useEffect(() => {
    if (!editor)
      return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowTextAlignDropdown({
          editor,
          alignTypes: types,
          hideWhenUnavailable,
          textAlignInSchema,
          canSetAny,
        }),
      )
    }

    handleSelectionUpdate()

    editor.on('selectionUpdate', handleSelectionUpdate)

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [canSetAny, editor, hideWhenUnavailable, textAlignInSchema, types])

  return {
    isVisible,
    activeAlign,
    isActive: isAnyActive,
    canToggle: canSetAny,
    types,
    filteredAligns,
    label: toolbarLabels.textAlign,
    Icon: activeOption
      ? textAlignIcons[activeOption.align]
      : AlignLeftIcon,
  }
}
