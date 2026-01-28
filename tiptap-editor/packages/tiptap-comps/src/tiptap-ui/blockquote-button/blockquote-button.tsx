import type { ButtonProps } from 'comps'

import type { UseBlockquoteConfig } from './use-blockquote'
import { Badge, Button } from 'comps'
import { forwardRef, useCallback } from 'react'

import { useTiptapEditor } from 'tiptap-api/react'
import { parseShortcutKeys } from 'tiptap-utils'
import {
  BLOCKQUOTE_SHORTCUT_KEY,
  useBlockquote,
} from './use-blockquote'

export interface BlockquoteButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseBlockquoteConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean
}

export function BlockquoteShortcutBadge({
  shortcutKeys = BLOCKQUOTE_SHORTCUT_KEY,
}: {
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/**
 * Button component for toggling blockquote in a Tiptap editor.
 *
 * For custom button implementations, use the `useBlockquote` hook instead.
 */
export const BlockquoteButton = forwardRef<
  HTMLButtonElement,
  BlockquoteButtonProps
>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onToggled,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const {
      isVisible,
      canToggle,
      isActive,
      handleToggle,
      label,
      shortcutKeys,
      Icon,
    } = useBlockquote({
      editor,
      hideWhenUnavailable,
      onToggled,
    })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        handleToggle()
      },
      [handleToggle, onClick],
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
        tabIndex={ -1 }
        disabled={ !canToggle }
        aria-label={ label }
        aria-pressed={ isActive }
        tooltip={ label }
        onClick={ handleClick }
        leftIcon={ children ? null : <Icon className="size-5 text-icon" /> }
        { ...buttonProps }
        ref={ ref }
      >
        { children ?? (
          <>
            { text && <span className="text-base text-textSecondary">{ text }</span> }
            { showShortcut && (
              <BlockquoteShortcutBadge shortcutKeys={ shortcutKeys } />
            ) }
          </>
        ) }
      </Button>
    )
  },
)

BlockquoteButton.displayName = 'BlockquoteButton'
