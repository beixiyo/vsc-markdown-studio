import type { SuggestionItem } from '../../types'
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react'
import { forwardRef, memo, useEffect, useMemo, useRef } from 'react'
import { cn } from 'tiptap-config'

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

const defaultRect: DOMRect = {
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  toJSON() {
    return ''
  },
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
  const virtualElement = useMemo(() => {
    if (!referenceRect) {
      return null
    }
    return {
      getBoundingClientRect: () => referenceRect ?? defaultRect,
    }
  }, [referenceRect])

  const { refs, floatingStyles, context } = useFloating({
    placement: 'bottom-start',
    open: open && Boolean(referenceRect),
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({
        fallbackAxisSideDirection: 'start',
        padding: 8,
      }),
      shift({
        padding: 8,
      }),
    ],
  })

  useEffect(() => {
    if (virtualElement && open) {
      refs.setReference(virtualElement)
    }
  }, [virtualElement, open, refs])

  const dismiss = useDismiss(context)
  const { getFloatingProps } = useInteractions([dismiss])
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

  if (!open || !referenceRect) {
    return null
  }

  return (
    <FloatingPortal>
      <div
        ref={ refs.setFloating }
        style={ floatingStyles }
        className={ cn(
          'min-w-[220px] max-w-[320px] max-h-[320px] overflow-auto rounded-[var(--tt-radius-md)]',
          'border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)]',
          'text-[var(--text-color-primary)] shadow-[var(--tt-shadow-elevated-md)] outline-none',
        ) }
        tabIndex={ -1 }
        onMouseDownCapture={ (event) => {
          /** 保持编辑器焦点，避免 focusout 立刻关闭菜单导致点击失效 */
          event.preventDefault()
          event.stopPropagation()
        } }
        { ...getFloatingProps() }
      >
        { loading && (
          <div className="px-3 py-2 text-sm text-[var(--text-color-secondary)]">
            加载中…
          </div>
        ) }

        { !loading && error && (
          <div className="px-3 py-2 text-sm text-[var(--text-color-secondary)]">
            { error.message || '加载失败' }
          </div>
        ) }

        { !loading && !error && items.length === 0 && (
          <div className="px-3 py-2 text-sm text-[var(--text-color-secondary)]">
            { query
              ? '无匹配项'
              : '无可用项' }
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
    </FloatingPortal>
  )
})

SuggestionMenu.displayName = 'SuggestionMenu'

interface SuggestionMenuItemProps {
  item: SuggestionItem
  active: boolean
  onMouseEnter: () => void
  onClick: () => void
}

const SuggestionMenuItem = memo(forwardRef<HTMLButtonElement, SuggestionMenuItemProps>(
  ({ item, active, onMouseEnter, onClick }, ref) => {
    return (
      <button
        ref={ ref }
        type="button"
        onMouseEnter={ onMouseEnter }
        onClick={ onClick }
        className={ cn(
          'flex w-full items-start gap-3 px-3 py-2 text-left',
          'text-[var(--text-color-primary)]',
          'transition-colors duration-150',
          active
            ? 'bg-[var(--bg-color-hover)]'
            : 'bg-transparent border-0 cursor-pointer hover:bg-[var(--bg-color-hover)]',
        ) }
      >
        <div className="mt-[2px] flex h-5 w-5 flex-shrink-0 items-center justify-center text-[var(--text-color-primary)]">
          { item.icon ?? <span className="h-5 w-5" /> }
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-[var(--text-color-primary)]">
            { item.title }
          </span>
          { item.subtitle
            ? (
                <span className="text-xs text-[var(--text-color-secondary)]">
                  { item.subtitle }
                </span>
              )
            : null }
        </div>
      </button>
    )
  },
))

SuggestionMenuItem.displayName = 'SuggestionMenuItem'
