import type { Editor } from '@tiptap/react'
import { Button, Card, Separator } from 'comps'
import { memo, useMemo, useRef } from 'react'
import { useIsBreakpoint, useMarkLabels, useMenuNavigation } from 'tiptap-api/react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { BanIcon } from '../../icons'
import { ColorHighlightButton } from '../color-highlight-button'
import { useColorHighlight } from '../color-highlight-button/use-color-highlight'
import { DEFAULT_HIGHLIGHT_COLORS } from './constants'

/** 高亮颜色弹层内容：颜色按钮 + 移除高亮 */
export const ColorHighlightPopoverContent = memo(({
  editor,
  colors = DEFAULT_HIGHLIGHT_COLORS,
}: ColorHighlightPopoverContentProps) => {
  const { removeHighlight } = useMarkLabels()
  const { handleRemoveHighlight } = useColorHighlight({ editor })
  const isMobile = useIsBreakpoint()
  const containerRef = useRef<HTMLDivElement>(null)

  const menuItems = useMemo(
    () => [...colors.map(c => ({ value: c, label: c })), { label: removeHighlight, value: 'none' }],
    [colors, removeHighlight],
  )

  const { selectedIndex } = useMenuNavigation({
    containerRef,
    items: menuItems,
    orientation: 'both',
    onSelect: (item) => {
      if (!containerRef.current)
        return false
      const highlightedElement = containerRef.current.querySelector(
        '[data-highlighted="true"]',
      ) as HTMLElement
      if (highlightedElement)
        highlightedElement.click()
      if (item.value === 'none')
        handleRemoveHighlight()
      return true
    },
    autoSelectFirstItem: false,
  })

  return (
    <Card
      ref={ containerRef }
      tabIndex={ 0 }
      className="outline-none min-w-max"
      { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
      padding="none"
      bordered={ !isMobile }
      shadow={ isMobile
        ? 'none'
        : 'md' }
    >
      <div className="flex flex-row items-center gap-1 p-1">
        <div className="flex flex-row items-center">
          { colors.map((color, index) => (
            <ColorHighlightButton
              key={ color }
              editor={ editor }
              highlightColor={ color }
              tabIndex={ index === selectedIndex
                ? 0
                : -1 }
            />
          )) }
        </div>

        <Separator />

        <div className="flex flex-row items-center">
          <Button
            onClick={ handleRemoveHighlight }
            aria-label={ removeHighlight }
            tooltip={ removeHighlight }
            type="button"
            role="menuitem"
            variant="ghost"
            size="sm"
            data-highlighted={ selectedIndex === colors.length }
          >
            <BanIcon className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
})

ColorHighlightPopoverContent.displayName = 'ColorHighlightPopoverContent'

export interface ColorHighlightPopoverContentProps {
  /** 编辑器实例 */
  editor?: Editor | null
  /** 弹层中展示的颜色列表，不传则使用默认预设 */
  colors?: string[]
}
