import { mixColor } from '@jl-org/tool'
import { Badge, Button } from 'comps'
import { forwardRef, useCallback, useMemo } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { parseShortcutKeys, SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import {
  COLOR_HIGHLIGHT_SHORTCUT_KEY,
  useColorHighlight,
} from './use-color-highlight'

export interface ColorHighlightButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'type'> {
  highlightColor: string
  editor?: any
  hideWhenUnavailable?: boolean
  onApplied?: (info: { color: string, label: string }) => void
  text?: string
  showShortcut?: boolean
}

export function ColorHighlightShortcutBadge({
  shortcutKeys = COLOR_HIGHLIGHT_SHORTCUT_KEY,
}: {
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/**
 * Button component for applying color highlights in a Tiptap editor.
 *
 * For custom button implementations, use the `useColorHighlight` hook instead.
 *
 * @example
 * ```tsx
 * // Mark-based highlighting
 * <ColorHighlightButton highlightColor="yellow" />
 *
 * // With custom callback
 * <ColorHighlightButton
 *   highlightColor="red"
 *   onApplied={({ color, label }) => console.log(`Applied ${color}`)}
 * />
 * ```
 */
export const ColorHighlightButton = forwardRef<
  HTMLButtonElement,
  ColorHighlightButtonProps
>(
  (
    {
      editor: providedEditor,
      highlightColor,
      text,
      hideWhenUnavailable = false,
      onApplied,
      showShortcut = false,
      onClick,
      children,
      style,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const {
      isVisible,
      canColorHighlight,
      isActive,
      handleColorHighlight,
      label,
      shortcutKeys,
    } = useColorHighlight({
      editor,
      highlightColor,
      label: text || `Toggle highlight (${highlightColor})`,
      hideWhenUnavailable,
      onApplied,
    })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        handleColorHighlight()
      },
      [handleColorHighlight, onClick],
    )

    const buttonStyle = useMemo(
      () =>
        ({
          ...style,
          '--highlight-color': highlightColor,
        }) as React.CSSProperties,
      [highlightColor, style],
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        name={ isActive ? 'active' : undefined }
        role="button"
        className="hover:bg-background"
        tabIndex={ -1 }
        disabled={ !canColorHighlight }
        aria-label={ label }
        aria-pressed={ isActive }
        onClick={ handleClick }
        style={ buttonStyle }
        { ...buttonProps }
        { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
        ref={ ref }
      >
        { children ?? (
          <>
            <div
              className="relative size-5 rounded-full hover:border transition-all duration-300"
              style={ {
                backgroundColor: highlightColor,
                borderColor: mixColor(highlightColor, '#0008', 0.9),
              } }
            />
            { text && <span className="flex-auto text-left px-0.5">{ text }</span> }
            { showShortcut && (
              <ColorHighlightShortcutBadge shortcutKeys={ shortcutKeys } />
            ) }
          </>
        ) }
      </Button>
    )
  },
)

ColorHighlightButton.displayName = 'ColorHighlightButton'
