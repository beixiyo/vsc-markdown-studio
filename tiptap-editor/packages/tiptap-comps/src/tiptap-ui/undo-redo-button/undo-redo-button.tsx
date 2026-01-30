'use client'

import type { ButtonProps } from 'comps'
import type {
  UndoRedoAction,
  UseUndoRedoConfig,
} from './use-undo-redo'

import { Badge, Button } from 'comps'
import { forwardRef, useCallback } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { parseShortcutKeys } from 'tiptap-utils'
import {
  UNDO_REDO_SHORTCUT_KEYS,
  useUndoRedo,
} from './use-undo-redo'

/** 撤销/重做快捷键角标 */
export function HistoryShortcutBadge({
  action,
  shortcutKeys = UNDO_REDO_SHORTCUT_KEYS[action],
}: {
  action: UndoRedoAction
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/** 触发撤销/重做的按钮；自定义实现请使用 useUndoRedo */
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
        size="sm"
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

export interface UndoRedoButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseUndoRedoConfig {
  /** 图标旁可选文案 */
  text?: string
  /** 是否显示快捷键，默认 false */
  showShortcut?: boolean
}
