import { forwardRef, useCallback, useMemo } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { parseShortcutKeys } from 'tiptap-utils'
import { Badge, Button } from '../../ui'
import {
  COLOR_HIGHLIGHT_SHORTCUT_KEY,
  useColorHighlight,
} from './use-color-highlight'

export interface ColorHighlightButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'type'> {
  highlightColor?: string
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
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>
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
        data-style="ghost"
        data-active-state={ isActive
          ? 'on'
          : 'off' }
        role="button"
        tabIndex={ -1 }
        disabled={ !canColorHighlight }
        data-disabled={ !canColorHighlight }
        aria-label={ label }
        aria-pressed={ isActive }
        tooltip={ label }
        onClick={ handleClick }
        style={ buttonStyle }
        { ...buttonProps }
        ref={ ref }
      >
        { children ?? (
          <>
            <span
              className="relative w-[14px] h-[14px] -mx-0.5 rounded-full transition-transform duration-200 after:content-[''] after:absolute after:inset-0 after:rounded-inherit after:box-border after:border after:border-[inherit] after:filter after:brightness-95 after:mix-blend-multiply dark:after:brightness-140 dark:after:mix-blend-lighten"
              style={ {
                backgroundColor: highlightColor,
                borderColor: highlightColor,
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
