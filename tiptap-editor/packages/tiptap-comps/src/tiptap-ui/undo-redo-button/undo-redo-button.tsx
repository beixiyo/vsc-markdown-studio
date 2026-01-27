'use client'

import type { ButtonProps } from 'comps'
import type {
  UndoRedoAction,
  UseUndoRedoConfig,
} from './use-undo-redo'

import { forwardRef, useCallback } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { parseShortcutKeys } from 'tiptap-utils'
import { Badge, Button } from 'comps'
import {
  UNDO_REDO_SHORTCUT_KEYS,
  useUndoRedo,
} from './use-undo-redo'

export interface UndoRedoButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseUndoRedoConfig {
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

export function HistoryShortcutBadge({
  action,
  shortcutKeys = UNDO_REDO_SHORTCUT_KEYS[action],
}: {
  action: UndoRedoAction
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/**
 * Button component for triggering undo/redo actions in a Tiptap editor.
 *
 * For custom button implementations, use the `useHistory` hook instead.
 */
export const UndoRedoButton = forwardRef<
  HTMLButtonElement,
  UndoRedoButtonProps
>(
  (
    {
      editor: providedEditor,
      action,
      text,
      hideWhenUnavailable = false,
      onExecuted,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const { isVisible, handleAction, label, canExecute, Icon, shortcutKeys }
      = useUndoRedo({
        editor,
        action,
        hideWhenUnavailable,
        onExecuted,
      })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        handleAction()
      },
      [handleAction, onClick],
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        type="button"
        disabled={ !canExecute }
        variant="ghost"
        role="button"
        size='sm'
        tabIndex={ -1 }
        aria-label={ label }
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
              <HistoryShortcutBadge
                action={ action }
                shortcutKeys={ shortcutKeys }
              />
            ) }
          </>
        ) }
      </Button>
    )
  },
)

UndoRedoButton.displayName = 'UndoRedoButton'
