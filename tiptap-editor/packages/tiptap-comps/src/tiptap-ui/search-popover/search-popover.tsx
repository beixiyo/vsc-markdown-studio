'use client'

import type { PopoverRef } from 'comps'
import type { SearchPopoverProps, SearchPopoverRef } from './types'
import { Button, Popover } from 'comps'
import { useLatestCallback } from 'hooks'
import { ChevronDown, ChevronUp, SearchIcon, X } from 'lucide-react'
import { forwardRef, memo, useImperativeHandle, useRef } from 'react'
import { useTiptapEditorT } from 'tiptap-api/react'
import { TIPTAP_UI_STYLES } from '../constants'
import { SearchControlButton } from './search-control-button'
import { useEditorSearch } from './use-editor-search'

/**
 * Ctrl/Cmd-F 搜索面板
 *
 * 数据源有两种，UI 与交互完全一致：
 * - 默认驱动 tiptap 编辑器（消费 tiptap-search 的 headless 命令）
 * - 传入 `search` 则改为受控，交给宿主自己找 / 跳（如虚拟列表里的转写文本，
 *   命中在数据层算，不依赖 DOM）
 */
export const SearchPopover = memo(forwardRef<SearchPopoverRef, SearchPopoverProps>(({
  editor: providedEditor,
  search,
  children,
  icon,
  ...buttonProps
}, ref) => {
  const t = useTiptapEditorT()
  const popoverRef = useRef<PopoverRef>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const editorSearch = useEditorSearch(providedEditor, !search)
  /** 受控优先：宿主给了数据源就完全不碰编辑器 */
  const controller = search ?? editorSearch

  const focusInput = useLatestCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  })

  const handleOpen = useLatestCallback(() => {
    popoverRef.current?.open()
    focusInput()
  })

  useImperativeHandle(ref, () => ({
    open: handleOpen,
    close: () => popoverRef.current?.close(),
  }), [handleOpen])

  const handleKeyDown = useLatestCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      popoverRef.current?.close()
      return
    }

    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    if (event.shiftKey) {
      controller.onPrevious()
      return
    }

    controller.onNext()
  })

  const currentPosition = controller.matchCount > 0
    ? controller.activeIndex + 1
    : 0

  return (
    <Popover
      ref={ popoverRef }
      trigger="click"
      position="bottom"
      offset={ 8 }
      bordered={ false }
      onOpen={ focusInput }
      onClose={ controller.onClose }
      contentClassName="overflow-hidden rounded-xl bg-background shadow-[0_8px_48px_rgba(0,0,0,0.1)]"
      content={ (
        <div className="flex h-10 w-75 items-center gap-4 py-2 pl-3">
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <span className="sr-only">{ t('search.searchText') }</span>
            <input
              ref={ inputRef }
              value={ controller.query }
              type="text"
              enterKeyHint="search"
              placeholder={ t('search.search') }
              className="h-6 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-5.5 text-text outline-none placeholder:text-text4"
              onChange={ event => controller.onQueryChange(event.target.value) }
              onKeyDown={ handleKeyDown }
            />
            <span className="shrink-0 text-[10px] leading-3.5 text-text4">
              { currentPosition }
              /
              { controller.matchCount }
            </span>
          </label>

          <div className="flex shrink-0 items-center gap-1 pr-1">
            <SearchControlButton
              label={ t('search.previousResult') }
              disabled={ controller.matchCount === 0 }
              onClick={ controller.onPrevious }
            >
              <ChevronUp />
            </SearchControlButton>
            <SearchControlButton
              label={ t('search.nextResult') }
              disabled={ controller.matchCount === 0 }
              onClick={ controller.onNext }
            >
              <ChevronDown />
            </SearchControlButton>
            <span className="mx-0.5 h-3.75 w-px rounded-sm bg-border" />
            <SearchControlButton
              label={ t('search.close') }
              onClick={ () => popoverRef.current?.close() }
            >
              <X />
            </SearchControlButton>
          </div>
        </div>
      ) }
    >
      { children ?? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          tabIndex={ -1 }
          aria-label={ t('search.search') }
          tooltip={ t('search.search') }
          { ...buttonProps }
        >
          { icon ?? <SearchIcon className={ TIPTAP_UI_STYLES.icon } /> }
        </Button>
      ) }
    </Popover>
  )
}))

SearchPopover.displayName = 'SearchPopover'
