'use client'

import type { Editor } from '@tiptap/react'
import { useCallback } from 'react'
import { useHeadingLabels, useTiptapEditor } from 'tiptap-api/react'

import {
  isNodeInSchema,
  isNodeTypeSelected,
  selectionWithinConvertibleTypes,
} from 'tiptap-utils'
import {
  HeadingFiveIcon,
  HeadingFourIcon,
  HeadingOneIcon,
  HeadingSixIcon,
  HeadingThreeIcon,
  HeadingTwoIcon,
} from '../../icons'

export type Level = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Configuration for the heading functionality
 */
export interface UseHeadingConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * The heading level.
   */
  level: Level
  /**
   * Whether the button should hide when heading is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful heading toggle.
   */
  onToggled?: () => void
}

export const headingIcons = {
  1: HeadingOneIcon,
  2: HeadingTwoIcon,
  3: HeadingThreeIcon,
  4: HeadingFourIcon,
  5: HeadingFiveIcon,
  6: HeadingSixIcon,
}

export const HEADING_SHORTCUT_KEYS: Record<Level, string> = {
  1: 'ctrl+alt+1',
  2: 'ctrl+alt+2',
  3: 'ctrl+alt+3',
  4: 'ctrl+alt+4',
  5: 'ctrl+alt+5',
  6: 'ctrl+alt+6',
}

/**
 * Checks if heading can be toggled in the current editor state
 */
export function canToggle(
  editor: Editor | null,
  level?: Level,
  turnInto: boolean = true,
): boolean {
  if (!editor || !editor.isEditable)
    return false
  if (
    !isNodeInSchema('heading', editor)
    || isNodeTypeSelected(editor, ['image'])
  ) {
    return false
  }

  if (!turnInto) {
    return level
      ? editor.can().toggleHeading({ level })
      : editor.can().toggleHeading({ level: 1 })
  }

  // Ensure selection is in nodes we're allowed to convert
  if (
    !selectionWithinConvertibleTypes(editor, [
      'paragraph',
      'heading',
      'bulletList',
      'orderedList',
      'taskList',
      'blockquote',
      'codeBlock',
    ])
  ) {
    return false
  }

  // Either we can set heading directly on the selection,
  // or we can clear formatting/nodes to arrive at a heading.
  return level
    ? editor.can().toggleHeading({ level }) || editor.can().clearNodes()
    : editor.can().toggleHeading({ level: 1 }) || editor.can().clearNodes()
}

/**
 * Checks if heading is currently active
 */
export function isHeadingActive(
  editor: Editor | null,
  level?: Level | Level[],
): boolean {
  if (!editor || !editor.isEditable)
    return false

  if (Array.isArray(level)) {
    return level.some(l => editor.isActive('heading', { level: l }))
  }

  return level
    ? editor.isActive('heading', { level })
    : editor.isActive('heading')
}

/**
 * Toggles heading in the editor
 */
export function toggleHeading(
  editor: Editor | null,
  level: Level | Level[],
): boolean {
  if (!editor || !editor.isEditable)
    return false

  const levels = Array.isArray(level)
    ? level
    : [level]
  const toggleLevel = levels.find(l => canToggle(editor, l))

  if (!toggleLevel) {
    return false
  }

  try {
    const isActive = levels.some(l =>
      editor.isActive('heading', { level: l }),
    )

    const chain = editor.chain().focus()

    // 修复：不要去把 TextSelection 乱转换，Tiptap 能够原生处理
    const toggle = isActive
      ? chain.setNode('paragraph')
      : chain.setNode('heading', { level: toggleLevel })

    return toggle.run()
  }
  catch (e) {
    console.error('toggleHeading: error', e)
    return false
  }
}

/**
 * Determines if the heading button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  level?: Level | Level[]
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, level, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable)
    return false
  if (!isNodeInSchema('heading', editor))
    return false

  if (hideWhenUnavailable && !editor.isActive('code')) {
    if (Array.isArray(level)) {
      return level.some(l => canToggle(editor, l))
    }
    return canToggle(editor, level)
  }

  return true
}

/**
 * Custom hook that provides heading functionality for Tiptap editor
 */
export function useHeading(config: UseHeadingConfig) {
  const {
    editor: providedEditor,
    level,
    hideWhenUnavailable = false,
    onToggled,
  } = config

  const { editor } = useTiptapEditor(providedEditor)
  const headingLabels = useHeadingLabels()
  const isVisible = shouldShowButton({ editor, level, hideWhenUnavailable })
  const canToggleState = canToggle(editor, level)
  const isActive = isHeadingActive(editor, level)

  const handleToggle = useCallback(() => {
    if (!editor)
      return false

    const success = toggleHeading(editor, level)
    if (success) {
      onToggled?.()
    }
    return success
  }, [editor, level, onToggled])

  const getHeadingLabel = (level: Level): string => {
    switch (level) {
      case 1:
        return headingLabels.heading1
      case 2:
        return headingLabels.heading2
      case 3:
        return headingLabels.heading3
      case 4:
        return headingLabels.heading4
      case 5:
        return headingLabels.heading5
      case 6:
        return headingLabels.heading6
      default:
        return headingLabels.heading
    }
  }

  return {
    isVisible,
    isActive,
    handleToggle,
    canToggle: canToggleState,
    label: getHeadingLabel(level),
    shortcutKeys: HEADING_SHORTCUT_KEYS[level],
    Icon: headingIcons[level],
  }
}
