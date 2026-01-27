'use client'

import type { ButtonProps } from 'comps'

import type { Mark, UseMarkConfig } from './use-mark'

import { forwardRef, useCallback } from 'react'

import { useTiptapEditor } from 'tiptap-api/react'
import { parseShortcutKeys } from 'tiptap-utils'

import { Badge, Button } from 'comps'
import { MARK_SHORTCUT_KEYS, useMark } from './use-mark'

export interface MarkButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseMarkConfig {
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

export function MarkShortcutBadge({
  type,
  shortcutKeys = MARK_SHORTCUT_KEYS[type],
}: {
  type: Mark
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/**
 * Button component for toggling marks in a Tiptap editor.
 *
 * For custom button implementations, use the `useMark` hook instead.
 */
export const MarkButton = forwardRef<HTMLButtonElement, MarkButtonProps>(
  (
    {
      editor: providedEditor,
      type,
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
      handleMark,
      label,
      canToggle,
      isActive,
      Icon,
      shortcutKeys,
    } = useMark({
      editor,
      type,
      hideWhenUnavailable,
      onToggled,
    })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        handleMark()
      },
      [handleMark, onClick],
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        type="button"
        disabled={ !canToggle }
        variant="ghost"
        size="sm"
        name={ isActive ? 'active' : undefined }
        role="button"
        tabIndex={ -1 }
        aria-label={ label }
        aria-pressed={ isActive }
        tooltip={ label }
        onClick={ handleClick }
        { ...buttonProps }
        ref={ ref }
      >
        { children ?? (
          <>
            <Icon className="size-4" />
            { text && <span className="text-base text-textSecondary">{ text }</span> }
            { showShortcut && (
              <MarkShortcutBadge type={ type } shortcutKeys={ shortcutKeys } />
            ) }
          </>
        ) }
      </Button>
    )
  },
)

MarkButton.displayName = 'MarkButton'
