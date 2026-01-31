import type { ButtonProps } from 'comps'

import type { UseCodeBlockConfig } from './use-code-block'

import { Badge, Button } from 'comps'

import { forwardRef, useCallback } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'

import { parseShortcutKeys } from 'tiptap-utils'
import { TIPTAP_UI_STYLES } from '../constants'
import {
  CODE_BLOCK_SHORTCUT_KEY,
  useCodeBlock,
} from './use-code-block'

/** 代码块快捷键角标 */
export function CodeBlockShortcutBadge({
  shortcutKeys = CODE_BLOCK_SHORTCUT_KEY,
}: {
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/** 切换代码块的按钮；自定义实现请使用 useCodeBlock */
export const CodeBlockButton = forwardRef<
  HTMLButtonElement,
  CodeBlockButtonProps
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
    } = useCodeBlock({
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
        name={ isActive
          ? 'active'
          : undefined }
        role="button"
        disabled={ !canToggle }
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
            <Icon className={ TIPTAP_UI_STYLES.icon } />
            { text && <span className={ TIPTAP_UI_STYLES.triggerLabel }>{ text }</span> }
            { showShortcut && (
              <CodeBlockShortcutBadge shortcutKeys={ shortcutKeys } />
            ) }
          </>
        ) }
      </Button>
    )
  },
)

CodeBlockButton.displayName = 'CodeBlockButton'

export interface CodeBlockButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseCodeBlockConfig {
  /** 图标旁可选文案 */
  text?: string
  /** 是否显示快捷键，默认 false */
  showShortcut?: boolean
}
