'use client'

// --- UI Primitives ---
import type { ButtonProps } from 'comps'

// --- Tiptap UI ---
import type {
  Level,
  UseHeadingConfig,
} from './use-heading'

import { Badge, Button } from 'comps'
import { forwardRef, useCallback } from 'react'

import { useTiptapEditor } from 'tiptap-api/react'
// --- Lib ---
import { parseShortcutKeys } from 'tiptap-utils'
import {
  HEADING_SHORTCUT_KEYS,
  useHeading,
} from './use-heading'

export interface HeadingButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseHeadingConfig {
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

export function HeadingShortcutBadge({
  level,
  shortcutKeys = HEADING_SHORTCUT_KEYS[level],
}: {
  level: Level
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/**
 * Button component for toggling heading in a Tiptap editor.
 *
 * For custom button implementations, use the `useHeading` hook instead.
 */
export const HeadingButton = forwardRef<HTMLButtonElement, HeadingButtonProps>(
  (
    {
      editor: providedEditor,
      level,
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
      Icon,
      shortcutKeys,
    } = useHeading({
      editor,
      level,
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
        name={ isActive
          ? 'active'
          : undefined }
        role="button"
        tabIndex={ -1 }
        disabled={ !canToggle }
        aria-label={ label }
        aria-pressed={ isActive }
        tooltip={ label }
        onClick={ handleClick }
        leftIcon={ children
          ? null
          : <Icon className="size-5 text-icon" /> }
        { ...buttonProps }
        ref={ ref }
      >
        { children ?? (
          <>
            { text && <span className="text-base text-textSecondary">{ text }</span> }
            { showShortcut && (
              <HeadingShortcutBadge level={ level } shortcutKeys={ shortcutKeys } />
            ) }
          </>
        ) }
      </Button>
    )
  },
)

HeadingButton.displayName = 'HeadingButton'
