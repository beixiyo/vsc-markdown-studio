import { mixColor } from '@jl-org/tool'
import { Button } from 'comps'
import { forwardRef, useCallback, useMemo } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { cn } from 'utils'
import { ColorHighlightShortcutBadge } from './color-highlight-shortcut-badge'
import {
  useColorHighlight,
} from './use-color-highlight'

/** 应用颜色高亮的按钮；自定义实现请使用 useColorHighlight */
export const ColorHighlightButton = forwardRef<
  HTMLButtonElement,
  ColorHighlightButtonProps
>((
  {
    editor: providedEditor,
    highlightColor,
    text,
    hideWhenUnavailable = false,
    onApplied,
    showShortcut = false,
    onClick,
    children,
    style,
    ...buttonProps
  },
  ref,
) => {
  const { editor } = useTiptapEditor(providedEditor)
  const {
    isVisible,
    canColorHighlight,
    isActive,
    handleColorHighlight,
    label,
    shortcutKeys,
  } = useColorHighlight({
    editor,
    highlightColor,
    label: text || `Toggle highlight (${highlightColor})`,
    hideWhenUnavailable,
    onApplied,
  })

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (event.defaultPrevented)
        return
      handleColorHighlight()
    },
    [handleColorHighlight, onClick],
  )

  const buttonStyle = useMemo(
    () =>
      ({
        ...style,
        '--highlight-color': highlightColor,
      }) as React.CSSProperties,
    [highlightColor, style],
  )

  const borderColor = useMemo(() => {
    if (!highlightColor)
      return undefined
    if (highlightColor.startsWith('var')) {
      return 'rgb(var(--border) / 0.1)'
    }
    return mixColor(highlightColor, '#0008', 0.9)
  }, [highlightColor])

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
      className="hover:bg-background"
      tabIndex={ -1 }
      disabled={ !canColorHighlight }
      aria-label={ label }
      aria-pressed={ isActive }
      onClick={ handleClick }
      style={ buttonStyle }
      { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
      data-highlighted={ isActive }
      ref={ ref }
      { ...buttonProps }
    >
      { children ?? (
        <>
          <div
            className={ cn(
              'relative size-5 rounded-full transition-all',
              'hover:ring-1 ring-brand/50',
              isActive && 'ring-1',
            ) }
            style={ {
              backgroundColor: highlightColor,
              borderColor,
            } }
          />
          { text && <span className="flex-auto text-left px-0.5">{ text }</span> }
          { showShortcut && (
            <ColorHighlightShortcutBadge shortcutKeys={ shortcutKeys } />
          ) }
        </>
      ) }
    </Button>
  )
})

ColorHighlightButton.displayName = 'ColorHighlightButton'

export interface ColorHighlightButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'type'> {
  /** 高亮颜色 */
  highlightColor: string
  /** 编辑器实例 */
  editor?: any
  /** 不可用时是否隐藏，默认 false */
  hideWhenUnavailable?: boolean
  /** 应用高亮后的回调 */
  onApplied?: (info: { color: string, label: string }) => void
  /** 图标旁可选文案 */
  text?: string
  /** 是否显示快捷键，默认 false */
  showShortcut?: boolean
}
