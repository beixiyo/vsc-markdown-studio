'use client'

import type { Editor } from '@tiptap/core'
import type { SearchState } from 'tiptap-search'
import type { SearchController } from './types'
import { useCurrentEditor } from '@tiptap/react'
import { useLatestCallback } from 'hooks'
import { useEffect, useMemo, useState } from 'react'
import { getSearchState } from 'tiptap-search'

/**
 * 把 tiptap 编辑器包装成搜索面板的数据源
 *
 * 命中位置与高亮都由 tiptap-search 在 ProseMirror 文档上完成，这里只做状态转发。
 * `enabled` 为 false（宿主已受控）时不订阅编辑器事务，避免白白重渲染
 */
export function useEditorSearch(
  providedEditor: Editor | null | undefined,
  enabled: boolean,
): SearchController {
  const { editor: contextEditor } = useCurrentEditor()
  const editor = providedEditor ?? contextEditor
  const [query, setQuery] = useState('')
  const [searchState, setSearchState] = useState<SearchState>(() => getSearchState(editor))

  const syncSearchState = useLatestCallback(() => {
    setSearchState(getSearchState(editor))
  })

  useEffect(() => {
    if (!editor || !enabled) {
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
  }, [editor, enabled])

  const onQueryChange = useLatestCallback((value: string) => {
    setQuery(value)
    editor?.commands.setSearchQuery(value)
    syncSearchState()
  })

  const onPrevious = useLatestCallback(() => {
    editor?.commands.previousSearchResult()
    syncSearchState()
  })

  const onNext = useLatestCallback(() => {
    editor?.commands.nextSearchResult()
    syncSearchState()
  })

  const onClose = useLatestCallback(() => {
    editor?.commands.clearSearch()
    syncSearchState()
    setQuery('')
  })

  return useMemo(() => ({
    query,
    matchCount: searchState.matches.length,
    activeIndex: searchState.currentIndex,
    onQueryChange,
    onPrevious,
    onNext,
    onClose,
  }), [query, searchState, onQueryChange, onPrevious, onNext, onClose])
}
