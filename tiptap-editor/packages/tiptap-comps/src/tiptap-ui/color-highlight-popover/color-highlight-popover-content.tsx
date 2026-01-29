import type { Editor } from '@tiptap/react'
import { Button, Card, Separator } from 'comps'
import { memo, useMemo, useRef } from 'react'
import { useIsBreakpoint, useMenuNavigation } from 'tiptap-api/react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { BanIcon } from '../../icons'
import { ColorHighlightButton } from '../color-highlight-button'
import { useColorHighlight } from '../color-highlight-button/use-color-highlight'
import { DEFAULT_HIGHLIGHT_COLORS } from './constants'

export const ColorHighlightPopoverContent = memo(({
  editor,
  colors = DEFAULT_HIGHLIGHT_COLORS,
}: ColorHighlightPopoverContentProps) => {
  const { handleRemoveHighlight } = useColorHighlight({ editor })
  const isMobile = useIsBreakpoint()
  const containerRef = useRef<HTMLDivElement>(null)

  const menuItems = useMemo(
    () => [...colors.map(c => ({ value: c, label: c })), { label: 'Remove highlight', value: 'none' }],
    [colors],
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
            aria-label="Remove highlight"
            tooltip="Remove highlight"
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
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Optional colors to use in the highlight popover.
   * If not provided, defaults to a predefined set of colors.
   */
  colors?: string[]
}
