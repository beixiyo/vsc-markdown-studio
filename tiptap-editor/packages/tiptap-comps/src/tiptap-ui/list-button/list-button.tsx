'use client'

// --- UI Primitives ---
import type { ButtonProps } from 'comps'

// --- Tiptap UI ---
import type { ListType, UseListConfig } from './use-list'

import { Badge, Button } from 'comps'

import { forwardRef, useCallback } from 'react'
// --- Hooks ---
import { useTiptapEditor } from 'tiptap-api/react'

// --- Lib ---
import { parseShortcutKeys } from 'tiptap-utils'
import { LIST_SHORTCUT_KEYS, useList } from './use-list'

/** 列表快捷键角标 */
export function ListShortcutBadge({
  type,
  shortcutKeys = LIST_SHORTCUT_KEYS[type],
}: {
  type: ListType
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/** 切换列表类型的按钮；自定义实现请使用 useList */
export const ListButton = forwardRef<HTMLButtonElement, ListButtonProps>(
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
      canToggle,
      isActive,
      handleToggle,
      label,
      shortcutKeys,
      Icon,
    } = useList({
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
              <ListShortcutBadge type={ type } shortcutKeys={ shortcutKeys } />
            ) }
          </>
        ) }
      </Button>
    )
  },
)

ListButton.displayName = 'ListButton'

export interface ListButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseListConfig {
  /** 图标旁可选文案 */
  text?: string
  /** 是否显示快捷键，默认 false */
  showShortcut?: boolean
}
