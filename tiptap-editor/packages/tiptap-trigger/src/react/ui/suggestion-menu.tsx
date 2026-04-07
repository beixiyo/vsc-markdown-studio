import type { SuggestionItem } from '../../types'
import { SafePortal } from 'comps'
import { useFloatingPosition } from 'hooks'
import { memo, useEffect, useRef } from 'react'
import { useCommentLabels } from 'tiptap-api/react'
import { cn } from 'utils'
import { SuggestionMenuItem } from './suggestion-menu-item'

export type SuggestionMenuProps = {
  open: boolean
  items: SuggestionItem[]
  activeIndex: number
  referenceRect: DOMRect | null
  loading: boolean
  error: Error | null
  query: string
  onActiveIndexChange: (index: number) => void
  onSelect: (index: number) => void | Promise<void>
}

export const SuggestionMenu = memo(({
  open,
  items,
  activeIndex,
  referenceRect,
  loading,
  error,
  query,
  onActiveIndexChange,
  onSelect,
}: SuggestionMenuProps) => {
  const labels = useCommentLabels()

  const contentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement>(null)

  const { style: floatingStyles } = useFloatingPosition(
    triggerRef,
    contentRef,
    {
      enabled: open && Boolean(referenceRect),
      placement: 'bottom-start',
      offset: 6,
      flip: true,
      shift: true,
      boundaryPadding: 8,
      virtualReferenceRect: referenceRect,
    },
  )

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    if (!open) {
      return
    }
    const target = itemRefs.current[activeIndex]
    if (target) {
      target.scrollIntoView({
        block: 'nearest',
      })
    }
  }, [activeIndex, open])

  return (
    <SafePortal>
      { open && referenceRect && (
        <div
          ref={ contentRef }
          style={ { ...floatingStyles, zIndex: 50 } }
          className={ cn(
            'min-w-[220px] max-w-[320px] max-h-[320px] overflow-auto rounded-lg',
            'border border-border bg-background',
            'text-text shadow-card outline-hidden',
          ) }
          tabIndex={ -1 }
          onMouseDownCapture={ (event) => {
            /** 保持编辑器焦点，避免 focusout 立刻关闭菜单导致点击失效 */
            event.preventDefault()
            event.stopPropagation()
          } }
        >
          { loading && (
            <div className="px-3 py-2 text-sm text-text2">
              { labels.loading }
            </div>
          ) }

          { !loading && error && (
            <div className="px-3 py-2 text-sm text-text2">
              { error.message || labels.loadFailed }
            </div>
          ) }

          { !loading && !error && items.length === 0 && (
            <div className="px-3 py-2 text-sm text-text2">
              { query
                ? labels.noMatch
                : labels.noItems }
            </div>
          ) }

          { !loading && !error && items.length > 0 && (
            <>
              { items.map((item, index) => (
                <SuggestionMenuItem
                  key={ item.id }
                  item={ item }
                  active={ index === activeIndex }
                  onMouseEnter={ () => onActiveIndexChange(index) }
                  onClick={ () => onSelect(index) }
                  ref={ (node) => {
                    itemRefs.current[index] = node
                  } }
                />
              )) }
            </>
          ) }
        </div>
      ) }
    </SafePortal>
  )
})

SuggestionMenu.displayName = 'SuggestionMenu'
