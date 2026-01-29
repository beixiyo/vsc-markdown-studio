import type { Editor } from '@tiptap/core'
import type { SuggestionState } from '../types'
import type { SuggestionConfig, SuggestionResult } from './types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLatestRef } from 'hooks'
import { useSuggestionData } from './useSuggestionData'
import { useSuggestionKeyboard } from './useSuggestionKeyboard'
import { useSuggestionState } from './useSuggestionState'

/**
 * 将插件状态机与数据源、UI 交互粘合的控制器
 * 仅处理状态流转和数据请求，不包含具体 UI
 */
export function useSuggestion(
  editor: Editor | null | undefined,
  config: SuggestionConfig,
): SuggestionResult {
  const configRef = useLatestRef(config)
  const { state, api } = useSuggestionState(editor, config)

  const triggerConfig = useMemo(() => {
    if (!state.triggerId) {
      return null
    }
    return configRef.current[state.triggerId] ?? null
  }, [state.triggerId])

  const { items, loading, error } = useSuggestionData({
    editor,
    active: state.active,
    query: state.query,
    ignoreQueryLength: state.ignoreQueryLength,
    triggerId: state.triggerId,
    triggerConfig,
  })

  // ======================
  // * Selection Logic
  // ======================
  const [activeIndex, setActiveIndex] = useState(0)
  const prevStateRef = useRef<SuggestionState | null>(null)

  useEffect(() => {
    const prev = prevStateRef.current
    /** 新的一轮触发：首次进入、触发器切换、从非激活变为激活时重置选中项 */
    const shouldReset = !prev
      || prev.triggerId !== state.triggerId
      || (!prev.active && state.active)

    if (shouldReset) {
      setActiveIndex(0)
    }

    prevStateRef.current = state
  }, [state])

  useEffect(() => {
    /** 数据源为空时重置索引，数据量减少时防止索引越界 */
    if (!items.length) {
      setActiveIndex(0)
      return
    }
    setActiveIndex(prev => Math.min(prev, items.length - 1))
  }, [items.length])

  // ======================
  // * Fns
  // ======================

  const selectItem = useCallback(
    async (index: number) => {
      if (!api || !state.active || !state.triggerId) {
        return
      }

      const item = items[index]
      if (!item) {
        return
      }

      const context = {
        triggerId: state.triggerId,
        query: state.query,
        queryStartPos: state.queryStartPos,
      }

      /** 先清理触发字符，避免部分命令（列表、引用）在转换后再删字符导致换行 */
      api.clearQuery()

      await item.onSelect(editor as Editor, context)
    },
    [items, state, editor, api],
  )

  const close = useCallback(() => {
    api?.close()
  }, [api])

  // ======================
  // * Keyboard Navigation
  // ======================
  useSuggestionKeyboard({
    editor,
    active: state.active,
    itemsCount: items.length,
    activeIndex,
    setActiveIndex,
    onSelect: selectItem,
    onClose: close,
  })

  return {
    open: state.active,
    items,
    loading,
    error,
    triggerId: state.triggerId,
    query: state.query,
    referenceRect: state.referenceRect,
    activeIndex,
    setActiveIndex,
    selectItem,
    close,
  }
}
