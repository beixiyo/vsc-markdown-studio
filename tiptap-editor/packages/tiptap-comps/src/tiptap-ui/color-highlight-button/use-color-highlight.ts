'use client'

import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

// --- Hooks ---
import { useIsBreakpoint, useTiptapEditor } from 'tiptap-api/react'

// --- Lib ---
import {
  isMarkInSchema,
  isNodeTypeSelected,
} from 'tiptap-utils'

// --- Icons ---
import { HighlighterIcon } from '../../icons'

export const COLOR_HIGHLIGHT_SHORTCUT_KEY = 'mod+shift+h'
export const HIGHLIGHT_COLORS = [
  {
    label: 'Default background',
    value: 'var(--background)',
    border: 'var(--borderSecondary)',
  },
  {
    label: 'Gray background',
    value: 'var(--toningGrayBgColor)',
    border: 'var(--toningGrayBorderColor)',
  },
  {
    label: 'Brown background',
    value: 'var(--toningBrownBgColor)',
    border: 'var(--toningBrownBorderColor)',
  },
  {
    label: 'Orange background',
    value: 'var(--toningOrangeBgColor)',
    border: 'var(--toningOrangeBorderColor)',
  },
  {
    label: 'Yellow background',
    value: 'var(--toningYellowBgColor)',
    border: 'var(--toningYellowBorderColor)',
  },
  {
    label: 'Green background',
    value: 'var(--toningGreenBgColor)',
    border: 'var(--toningGreenBorderColor)',
  },
  {
    label: 'Blue background',
    value: 'var(--toningBlueBgColor)',
    border: 'var(--toningBlueBorderColor)',
  },
  {
    label: 'Purple background',
    value: 'var(--toningPurpleBgColor)',
    border: 'var(--toningPurpleBorderColor)',
  },
  {
    label: 'Pink background',
    value: 'var(--toningPinkBgColor)',
    border: 'var(--toningPinkBorderColor)',
  },
  {
    label: 'Red background',
    value: 'var(--toningRedBgColor)',
    border: 'var(--toningRedBorderColor)',
  },
]
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]

/**
 * Configuration for the color highlight functionality
 */
export interface UseColorHighlightConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * The color to apply when toggling the highlight.
   */
  highlightColor?: string
  /**
   * Optional label to display alongside the icon.
   */
  label?: string
  /**
   * Whether the button should hide when the mark is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Called when the highlight is applied.
   */
  onApplied?: ({
    color,
    label,
  }: {
    color: string
    label: string
  }) => void
}

export function pickHighlightColorsByValue(values: string[]) {
  const colorMap = new Map(
    HIGHLIGHT_COLORS.map(color => [color.value, color]),
  )
  return values
    .map(value => colorMap.get(value))
    .filter((color): color is (typeof HIGHLIGHT_COLORS)[number] => !!color)
}

/**
 * Checks if highlight can be applied based on the current editor state
 */
export function canColorHighlight(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable)
    return false

  if (
    !isMarkInSchema('highlight', editor)
    || isNodeTypeSelected(editor, ['image'])
  ) {
    return false
  }

  return editor.can().setMark('highlight')
}

/**
 * Checks if highlight is currently active
 */
export function isColorHighlightActive(
  editor: Editor | null,
  highlightColor?: string,
): boolean {
  if (!editor || !editor.isEditable)
    return false

  return highlightColor
    ? editor.isActive('highlight', { color: highlightColor })
    : editor.isActive('highlight')
}

/**
 * Removes highlight
 */
export function removeHighlight(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable)
    return false
  if (!canColorHighlight(editor))
    return false

  return editor.chain().focus().unsetMark('highlight').run()
}

/**
 * Determines if the highlight button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable)
    return false

  if (!isMarkInSchema('highlight', editor))
    return false

  if (hideWhenUnavailable && !editor.isActive('code')) {
    return canColorHighlight(editor)
  }

  return true
}

export function useColorHighlight(config: UseColorHighlightConfig) {
  const {
    editor: providedEditor,
    label,
    highlightColor,
    hideWhenUnavailable = false,
    onApplied,
  } = config

  const { editor } = useTiptapEditor(providedEditor)
  const isMobile = useIsBreakpoint()
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canColorHighlightState = canColorHighlight(editor)
  const isActive = isColorHighlightActive(editor, highlightColor)

  useEffect(() => {
    if (!editor)
      return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }))
    }

    handleSelectionUpdate()

    editor.on('selectionUpdate', handleSelectionUpdate)

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleColorHighlight = useCallback(() => {
    if (!editor || !canColorHighlightState || !highlightColor || !label)
      return false

    if (editor.state.storedMarks) {
      const highlightMarkType = editor.schema.marks.highlight
      if (highlightMarkType) {
        editor.view.dispatch(
          editor.state.tr.removeStoredMark(highlightMarkType),
        )
      }
    }

    setTimeout(() => {
      const success = editor
        .chain()
        .focus()
        .toggleMark('highlight', { color: highlightColor })
        .run()
      if (success) {
        onApplied?.({ color: highlightColor, label })
      }
      return success
    }, 0)

    return true
  }, [canColorHighlightState, highlightColor, editor, label, onApplied])

  const handleRemoveHighlight = useCallback(() => {
    const success = removeHighlight(editor)
    if (success) {
      onApplied?.({ color: '', label: 'Remove highlight' })
    }
    return success
  }, [editor, onApplied])

  useHotkeys(
    COLOR_HIGHLIGHT_SHORTCUT_KEY,
    (event) => {
      event.preventDefault()
      handleColorHighlight()
    },
    {
      enabled: isVisible && canColorHighlightState,
      enableOnContentEditable: !isMobile,
      enableOnFormTags: true,
    },
  )

  return {
    isVisible,
    isActive,
    handleColorHighlight,
    handleRemoveHighlight,
    canColorHighlight: canColorHighlightState,
    label: label || `Highlight`,
    shortcutKeys: COLOR_HIGHLIGHT_SHORTCUT_KEY,
    Icon: HighlighterIcon,
  }
}
