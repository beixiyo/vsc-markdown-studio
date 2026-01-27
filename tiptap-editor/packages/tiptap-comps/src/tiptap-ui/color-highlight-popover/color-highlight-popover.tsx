import type { Editor } from '@tiptap/react'

import { forwardRef, useMemo, useRef } from 'react'
import { useIsBreakpoint, useMenuNavigation, useTiptapEditor } from 'tiptap-api/react'

import { BanIcon, HighlighterIcon } from '../../icons'
import { Button, Card, Popover } from 'comps'

import {
  ColorHighlightButton,
  type HighlightColor,
  type UseColorHighlightConfig,
} from '../color-highlight-button'
import {
  pickHighlightColorsByValue,
  useColorHighlight,
} from '../color-highlight-button/use-color-highlight'

export interface ColorHighlightPopoverContentProps {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Optional colors to use in the highlight popover.
   * If not provided, defaults to a predefined set of colors.
   */
  colors?: HighlightColor[]
}

export interface ColorHighlightPopoverProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  Pick<
    UseColorHighlightConfig,
      'editor' | 'hideWhenUnavailable' | 'onApplied'
  > {
  /**
   * Optional colors to use in the highlight popover.
   * If not provided, defaults to a predefined set of colors.
   */
  colors?: HighlightColor[]
}

export const ColorHighlightPopoverButton = forwardRef<
  HTMLButtonElement,
  any
>(({ className, children, ...props }, ref) => (
  <Button
    type="button"
    className={ className }
    variant="ghost"
    role="button"
    tabIndex={ -1 }
    aria-label="Highlight text"
    tooltip="Highlight"
    ref={ ref }
    { ...props }
  >
    {children ?? <HighlighterIcon className="size-4" />}
  </Button>
))

ColorHighlightPopoverButton.displayName = 'ColorHighlightPopoverButton'

export function ColorHighlightPopoverContent({
  editor,
  colors = pickHighlightColorsByValue([
    'var(--toningGreenBgColor)',
    'var(--toningBlueBgColor)',
    'var(--toningRedBgColor)',
    'var(--toningPurpleBgColor)',
    'var(--toningYellowBgColor)',
  ]),
}: ColorHighlightPopoverContentProps) {
  const { handleRemoveHighlight } = useColorHighlight({ editor })
  const isMobile = useIsBreakpoint()
  const containerRef = useRef<HTMLDivElement>(null)

  const menuItems = useMemo(
    () => [...colors, { label: 'Remove highlight', value: 'none' }],
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
    <div ref={ containerRef } tabIndex={ 0 } className="outline-none">
      <Card
        padding="none"
        bordered={ !isMobile }
        shadow={ isMobile ? 'none' : 'md' }
        className="min-w-max"
      >
        <div className="flex flex-row items-center gap-1 p-1">
          <div className="flex flex-row items-center">
            {colors.map((color, index) => (
              <ColorHighlightButton
                key={ color.value }
                editor={ editor }
                highlightColor={ color.value }
                tooltip={ color.label }
                aria-label={ `${color.label} highlight color` }
                tabIndex={ index === selectedIndex
                  ? 0
                  : -1 }
                data-highlighted={ selectedIndex === index }
              />
            ))}
          </div>

          <div className="w-px h-4 bg-border/50 mx-1" />

          <div className="flex flex-row items-center">
            <Button
              onClick={ handleRemoveHighlight }
              aria-label="Remove highlight"
              tooltip="Remove highlight"
              tabIndex={ selectedIndex === colors.length
                ? 0
                : -1 }
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
    </div>
  )
}

export function ColorHighlightPopover({
  editor: providedEditor,
  colors = pickHighlightColorsByValue([
    'var(--toningGreenBgColor)',
    'var(--toningBlueBgColor)',
    'var(--toningRedBgColor)',
    'var(--toningPurpleBgColor)',
    'var(--toningYellowBgColor)',
  ]),
  hideWhenUnavailable = false,
  onApplied,
  ...props
}: ColorHighlightPopoverProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const { isVisible, canColorHighlight, isActive, label, Icon }
    = useColorHighlight({
      editor,
      hideWhenUnavailable,
      onApplied,
    })

  if (!isVisible)
    return null

  return (
    <Popover
      trigger="click"
      content={ <ColorHighlightPopoverContent editor={ editor } colors={ colors } /> }
    >
      <ColorHighlightPopoverButton
        disabled={ !canColorHighlight }
        data-active-state={ isActive
          ? 'on'
          : 'off' }
        data-disabled={ !canColorHighlight }
        aria-pressed={ isActive }
        aria-label={ label }
        tooltip={ label }
        { ...props }
      >
        <Icon className="size-4" />
      </ColorHighlightPopoverButton>
    </Popover>
  )
}

export default ColorHighlightPopover
