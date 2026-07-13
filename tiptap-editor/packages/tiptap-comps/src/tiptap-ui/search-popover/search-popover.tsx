'use client'

import type { Editor } from '@tiptap/core'
import type { PopoverRef } from 'comps'
import type { SearchState } from 'tiptap-search'
import { useCurrentEditor } from '@tiptap/react'
import { Button, Popover } from 'comps'
import { useLatestCallback } from 'hooks'
import { ChevronDown, ChevronUp, SearchIcon, X } from 'lucide-react'
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useTiptapEditorT } from 'tiptap-api/react'
import { getSearchState } from 'tiptap-search'
import { TIPTAP_UI_STYLES } from '../constants'

/**
 * Ctrl/Cmd-F 搜索面板
 * UI 只消费 tiptap-search 的 headless 命令，可替换为任意宿主界面
 */
export const SearchPopover = memo(forwardRef<SearchPopoverRef, SearchPopoverProps>(({
  editor: providedEditor,
  children,
  icon,
  ...buttonProps
}, ref) => {
  const t = useTiptapEditorT()
  const { editor: contextEditor } = useCurrentEditor()
  const editor = providedEditor ?? contextEditor
  const popoverRef = useRef<PopoverRef>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [searchState, setSearchState] = useState<SearchState>(() => getSearchState(editor))

  const syncSearchState = useLatestCallback(() => {
    setSearchState(getSearchState(editor))
  })

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

  const handleClose = useLatestCallback(() => {
    editor?.commands.clearSearch()
    syncSearchState()
    setQuery('')
  })

  const handleQueryChange = useLatestCallback((value: string) => {
    setQuery(value)
    editor?.commands.setSearchQuery(value)
    syncSearchState()
  })

  const handlePrevious = useLatestCallback(() => {
    editor?.commands.previousSearchResult()
    syncSearchState()
  })

  const handleNext = useLatestCallback(() => {
    editor?.commands.nextSearchResult()
    syncSearchState()
  })

  const handleKeyDown = useLatestCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    if (event.shiftKey) {
      handlePrevious()
      return
    }

    handleNext()
  })

  useEffect(() => {
    if (!editor) {
      setSearchState(getSearchState(null))
      return
    }

    const handleTransaction = () => {
      syncSearchState()
    }

    handleTransaction()
    editor.on('transaction', handleTransaction)
    return () => {
      editor.off('transaction', handleTransaction)
    }
  }, [editor])

  const currentPosition = searchState.matches.length > 0
    ? searchState.currentIndex + 1
    : 0

  return (
    <Popover
      ref={ popoverRef }
      trigger="click"
      position="bottom"
      offset={ 8 }
      bordered={ false }
      onOpen={ focusInput }
      onClose={ handleClose }
      contentClassName="overflow-hidden rounded-xl bg-background shadow-[0_8px_48px_rgba(0,0,0,0.1)]"
      content={ (
        <div className="flex h-10 w-75 items-center gap-4 py-2 pl-3">
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <span className="sr-only">{ t('search.searchText') }</span>
            <input
              ref={ inputRef }
              value={ query }
              type="text"
              enterKeyHint="search"
              placeholder={ t('search.search') }
              className="h-6 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-5.5 text-text outline-none placeholder:text-text4"
              onChange={ event => handleQueryChange(event.target.value) }
              onKeyDown={ handleKeyDown }
            />
            <span className="shrink-0 text-[10px] leading-3.5 text-text4">
              { currentPosition }
              /
              { searchState.matches.length }
            </span>
          </label>

          <div className="flex shrink-0 items-center gap-1 pr-1">
            <SearchControlButton
              label={ t('search.previousResult') }
              disabled={ searchState.matches.length === 0 }
              onClick={ handlePrevious }
            >
              <ChevronUp />
            </SearchControlButton>
            <SearchControlButton
              label={ t('search.nextResult') }
              disabled={ searchState.matches.length === 0 }
              onClick={ handleNext }
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

const SearchControlButton = memo<SearchControlButtonProps>(({
  label,
  children,
  ...props
}) => (
  <button
    type="button"
    aria-label={ label }
    title={ label }
    className="flex size-6 items-center justify-center rounded-full text-text transition-colors hover:bg-background2 disabled:cursor-default disabled:opacity-30 [&>svg]:size-3.5"
    { ...props }
  >
    { children }
  </button>
))

SearchControlButton.displayName = 'SearchControlButton'

/** 搜索面板属性 */
export interface SearchPopoverProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 可选编辑器实例，默认读取 Tiptap context */
  editor?: Editor | null
  /**
   * 覆盖默认触发按钮里的图标；只换图标，保留按钮本身的 tooltip / aria / 样式
   *
   * 若要整体替换触发器（连按钮一起），用 `children`
   *
   * @default <SearchIcon className="size-4" />
   */
  icon?: React.ReactNode
}

/** 搜索面板命令式控制接口，快捷键等打开方式由宿主决定 */
export type SearchPopoverRef = PopoverRef

interface SearchControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}
