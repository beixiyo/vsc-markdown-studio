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

/** 标题快捷键角标 */
export function HeadingShortcutBadge({
  level,
  shortcutKeys = HEADING_SHORTCUT_KEYS[level],
}: {
  level: Level
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/** 切换标题级别的按钮；自定义实现请使用 useHeading */
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

export interface HeadingButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseHeadingConfig {
  /** 图标旁可选文案 */
  text?: string
  /** 是否显示快捷键，默认 false */
  showShortcut?: boolean
}
