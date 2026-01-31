'use client'

import type { ButtonProps } from 'comps'

import type { Mark, UseMarkConfig } from './use-mark'

import { Badge, Button } from 'comps'

import { forwardRef, useCallback } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'

import { parseShortcutKeys } from 'tiptap-utils'
import { TIPTAP_UI_STYLES } from '../constants'
import { MARK_SHORTCUT_KEYS, useMark } from './use-mark'

/** 快捷键角标 */
export function MarkShortcutBadge({
  type,
  shortcutKeys = MARK_SHORTCUT_KEYS[type],
}: {
  type: Mark
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/** 用于切换 Tiptap 标记的按钮；自定义实现请使用 useMark */
export const MarkButton = forwardRef<HTMLButtonElement, MarkButtonProps>(
  (
    {
      editor: providedEditor,
      type,
      text,
      showLabel = false,
      showTooltip = true,
      labelClassName,
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

    const labelText = showLabel
      ? text ?? label
      : text

    return (
      <Button
        type="button"
        disabled={ !canToggle }
        variant="ghost"
        size="sm"
        name={ isActive
          ? 'active'
          : undefined }
        role="button"
        tabIndex={ -1 }
        aria-label={ label }
        aria-pressed={ isActive }
        tooltip={ showTooltip
          ? label
          : undefined }
        onClick={ handleClick }
        { ...buttonProps }
        ref={ ref }
      >
        { children ?? (
          <>
            <Icon className={ TIPTAP_UI_STYLES.iconSecondary } />
            { labelText && (
              <span className={ labelClassName ?? TIPTAP_UI_STYLES.cascaderOptionLabelWithIcon }>
                { labelText }
              </span>
            ) }
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

export interface MarkButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseMarkConfig {
  /** 图标旁可选文案 */
  text?: string
  /** 为 true 时用组件 tooltip（label）作为图标旁文案，默认 false */
  showLabel?: boolean
  /** 为 false 时不显示悬停 tooltip，默认 true */
  showTooltip?: boolean
  /** showLabel 时包裹文案的 span 的 class */
  labelClassName?: string
  /** 是否在按钮中显示快捷键，默认 false */
  showShortcut?: boolean
}
