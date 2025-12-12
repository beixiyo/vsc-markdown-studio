import { useEffect, useMemo, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react'
import type { SuggestionItem } from '../../types'

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
  onClose: () => void
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

export function SuggestionMenu({
  open,
  items,
  activeIndex,
  referenceRect,
  loading,
  error,
  query,
  onActiveIndexChange,
  onSelect,
  onClose,
}: SuggestionMenuProps) {
  const listRef = useRef<HTMLDivElement | null>(null)

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
    listRef.current?.focus()
  }, [open])

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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = items.length === 0 ? 0 : (activeIndex + 1) % items.length
      onActiveIndexChange(next)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const next =
        items.length === 0
          ? 0
          : (activeIndex - 1 + items.length) % items.length
      onActiveIndexChange(next)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      onSelect(activeIndex)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  if (!open || !referenceRect) {
    return null
  }

  return (
    <FloatingPortal>
      <div
        ref={ (node) => {
          refs.setFloating(node)
          listRef.current = node
        } }
        style={ floatingStyles }
        className="min-w-[220px] max-w-[320px] max-h-[320px] overflow-auto rounded-[var(--tt-radius-md)] border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)] text-[var(--tt-gray-light-900)] shadow-[var(--tt-shadow-elevated-md)] outline-none dark:text-[var(--tt-gray-dark-900)]"
        tabIndex={ -1 }
        onMouseDownCapture={ (event) => {
          // 保持编辑器焦点，避免 focusout 立刻关闭菜单导致点击失效
          event.preventDefault()
          event.stopPropagation()
        } }
        onKeyDown={ handleKeyDown }
        { ...getFloatingProps() }
      >
        { loading && (
          <div className="px-3 py-2 text-sm text-[var(--tt-gray-light-500)] dark:text-[var(--tt-gray-dark-500)]">
            加载中…
          </div>
        ) }

        { !loading && error && (
          <div className="px-3 py-2 text-sm text-[var(--tt-gray-light-500)] dark:text-[var(--tt-gray-dark-500)]">
            { error.message || '加载失败' }
          </div>
        ) }

        { !loading && !error && items.length === 0 && (
          <div className="px-3 py-2 text-sm text-[var(--tt-gray-light-500)] dark:text-[var(--tt-gray-dark-500)]">
            { query ? '无匹配项' : '无可用项' }
          </div>
        ) }

        { !loading && !error && items.length > 0 && (
          <div className="">
            { items.map((item, index) => {
              const active = index === activeIndex
              return (
                <button
                  key={ item.id }
                  type="button"
                  ref={ (node) => {
                    itemRefs.current[index] = node
                  } }
                  onMouseEnter={ () => onActiveIndexChange(index) }
                  onClick={ () => onSelect(index) }
                  className={
                    active
                      ? 'flex w-full items-start gap-3 px-3 py-2 text-left text-[var(--tt-gray-light-900)] bg-[var(--tt-gray-light-a-200)] transition-[background-color] duration-[var(--tt-transition-duration-default)] ease-[var(--tt-transition-easing-default)] dark:text-[var(--tt-gray-dark-900)] dark:bg-[var(--tt-gray-dark-a-200)]'
                      : 'flex w-full items-start gap-3 px-3 py-2 text-left text-[var(--tt-gray-light-900)] bg-transparent border-0 cursor-pointer transition-[background-color] duration-[var(--tt-transition-duration-default)] ease-[var(--tt-transition-easing-default)] hover:bg-[var(--tt-gray-light-a-100)] dark:text-[var(--tt-gray-dark-900)] dark:hover:bg-[var(--tt-gray-dark-a-100)]'
                  }
                >
                  <div className="mt-[2px] flex h-5 w-5 flex-shrink-0 items-center justify-center text-[var(--tt-gray-light-700)] dark:text-[var(--tt-gray-dark-600)]">
                    { item.icon ?? <span className="h-5 w-5" /> }
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-[var(--tt-gray-light-900)] dark:text-[var(--tt-gray-dark-900)]">
                      { item.title }
                    </span>
                    { item.subtitle ? (
                      <span className="text-xs text-[var(--tt-gray-light-500)] dark:text-[var(--tt-gray-dark-500)]">
                        { item.subtitle }
                      </span>
                    ) : null }
                  </div>
                </button>
              )
            }) }
          </div>
        ) }
      </div>
    </FloatingPortal>
  )
}

SuggestionMenu.displayName = 'SuggestionMenu'
