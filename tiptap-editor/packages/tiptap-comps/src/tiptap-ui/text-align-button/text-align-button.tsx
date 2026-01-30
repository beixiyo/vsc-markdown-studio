'use client'

// --- UI Primitives ---
import type { ButtonProps } from 'comps'

// --- Tiptap UI ---
import type {
  TextAlign,
  UseTextAlignConfig,
} from './use-text-align'

import { Badge, Button } from 'comps'

import { forwardRef, useCallback } from 'react'
// --- Hooks ---
import { useTiptapEditor } from 'tiptap-api/react'

// --- Lib ---
import { parseShortcutKeys } from 'tiptap-utils'
import {
  TEXT_ALIGN_SHORTCUT_KEYS,
  useTextAlign,
} from './use-text-align'

/** 文本对齐快捷键角标 */
export function TextAlignShortcutBadge({
  align,
  shortcutKeys = TEXT_ALIGN_SHORTCUT_KEYS[align],
}: {
  align: TextAlign
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/** 设置文本对齐的按钮；自定义实现请使用 useTextAlign */
export const TextAlignButton = forwardRef<
  HTMLButtonElement,
  TextAlignButtonProps
>(
  (
    {
      editor: providedEditor,
      align,
      text,
      hideWhenUnavailable = false,
      onAligned,
      showShortcut = false,
      onClick,
      icon: CustomIcon,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const {
      isVisible,
      handleTextAlign,
      label,
      canAlign,
      isActive,
      Icon,
      shortcutKeys,
    } = useTextAlign({
      editor,
      align,
      hideWhenUnavailable,
      onAligned,
    })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        handleTextAlign()
      },
      [handleTextAlign, onClick],
    )

    if (!isVisible) {
      return null
    }

    const RenderIcon = CustomIcon ?? Icon

    return (
      <Button
        type="button"
        disabled={ !canAlign }
        variant="ghost"
        size="sm"
        name={ isActive
          ? 'active'
          : undefined }
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
            <RenderIcon className="size-4" />
            { text && <span className="text-base text-textSecondary">{ text }</span> }
            { showShortcut && (
              <TextAlignShortcutBadge
                align={ align }
                shortcutKeys={ shortcutKeys }
              />
            ) }
          </>
        ) }
      </Button>
    )
  },
)

TextAlignButton.displayName = 'TextAlignButton'

type IconProps = React.SVGProps<SVGSVGElement>
type IconComponent = ({ className, ...props }: IconProps) => React.ReactElement

export interface TextAlignButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseTextAlignConfig {
  /** 图标旁可选文案 */
  text?: string
  /** 是否显示快捷键，默认 false */
  showShortcut?: boolean
  /** 可选自定义图标组件 */
  icon?: React.MemoExoticComponent<IconComponent> | React.FC<IconProps>
}
