import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import type {
  SuggestionItem,
  SuggestionPluginAPI, SuggestionState
} from '../types'
import { getSuggestionPluginAPI } from '../extension'
import { useWatchRef } from './useWatchRef'
import { ERROR_EXTENSION_API_NOT_AVAILABLE } from '../constans'
import { ERROR_EXTENSION_NOT_MOUNTED } from '../constans'
import type { SuggestionConfig, SuggestionResult } from './types'
import { isSameState } from './compare'


/**
 * 将插件状态机与数据源、UI 交互粘合的控制器
 * 仅处理状态流转和数据请求，不包含具体 UI
 */
export function useSuggestion(
  editor: Editor | null | undefined,
  config: SuggestionConfig
): SuggestionResult {
  const configRef = useWatchRef(config)
  const apiRef = useRef<SuggestionPluginAPI | null>(null)

  // ======================
  // * States
  // ======================

  const [state, setState] = useState<SuggestionState>({
    active: false,
    triggerId: null,
    triggerCharacter: null,
    query: '',
    queryStartPos: null,
    referenceRect: null,
    ignoreQueryLength: false,
    decorationId: null,
    deleteTriggerCharacter: false,
  })

  const [items, setItems] = useState<SuggestionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const requestIdRef = useRef(0)
  const prevStateRef = useRef<SuggestionState | null>(null)

  // ======================
  // * Effects
  // ======================

  /**
   * 注册 triggers（仅在 editor 就绪时执行一次）
   */
  useEffect(() => {
    if (!editor) {
      return
    }

    let unsubscribe: (() => void) | null = null
    let retryTimer: number | null = null
    let addedTriggerIds: string[] = []
    let disposed = false

    const setup = () => {
      if (disposed) {
        return
      }

      let api: SuggestionPluginAPI | null = null
      try {
        api = getSuggestionPluginAPI(editor)
      }
      catch (error) {
        if (
          error instanceof Error &&
          (error.message === ERROR_EXTENSION_API_NOT_AVAILABLE || error.message === ERROR_EXTENSION_NOT_MOUNTED)
        ) {
          retryTimer = window.setTimeout(setup, 1)
          return
        }
        console.error(ERROR_EXTENSION_NOT_MOUNTED, error)
        return
      }

      apiRef.current = api

      const entries = Object.entries(configRef.current)
      addedTriggerIds = entries.map(([id, cfg]) => {
        api?.addTrigger({
          id,
          ...cfg
        })
        return id
      })

      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }

      unsubscribe = api.subscribe((next) => {
        if (disposed) {
          return
        }
        setState((prev) => (isSameState(prev, next) ? prev : next))
      })
    }

    setup()

    return () => {
      disposed = true
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer)
      }
      if (unsubscribe) {
        unsubscribe()
      }
      const api = apiRef.current
      if (api && addedTriggerIds.length) {
        addedTriggerIds.forEach((id) => api.removeTrigger(id))
      }
    }
  }, [editor])

  const triggerConfig = useMemo(() => {
    if (!state.triggerId) {
      return null
    }
    return configRef.current[state.triggerId] ?? null
  }, [state.triggerId])

  useEffect(() => {
    const prev = prevStateRef.current
    // 新的一轮触发：首次进入、触发器切换、从非激活变为激活时重置选中项
    const shouldReset = !prev ||
      prev.triggerId !== state.triggerId ||
      (!prev.active && state.active)

    if (shouldReset) {
      setActiveIndex(0)
    }

    prevStateRef.current = state
  }, [state])

  useEffect(() => {
    // 数据源为空时重置索引，数据量减少时防止索引越界
    if (!items.length) {
      setActiveIndex(0)
      return
    }
    setActiveIndex((prev) => Math.min(prev, items.length - 1))
  }, [items.length])

  /**
   * 根据 state 拉取数据源
   */
  useEffect(() => {
    if (!state.active || !triggerConfig || !editor) {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    const minLen = triggerConfig.minQueryLength ?? 0
    if (!state.ignoreQueryLength && state.query.length < minLen) {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    const currentReq = ++requestIdRef.current
    setLoading(true)
    setError(null)

    Promise.all(
      triggerConfig.sources.map((source) =>
        source.fetchItems({
          triggerId: state.triggerId ?? '',
          query: state.query,
          editor: editor as Editor,
        })
      )
    )
      .then((results) => {
        if (currentReq !== requestIdRef.current) {
          return
        }
        setItems(results.flat())
        setLoading(false)
      })
      .catch((err) => {
        if (currentReq !== requestIdRef.current) {
          return
        }
        setItems([])
        setError(err instanceof Error ? err : new Error('unknown error'))
        setLoading(false)
      })
  }, [state.active, state.query, state.ignoreQueryLength, state.triggerId, triggerConfig, editor])

  // ======================
  // * Fns
  // ======================

  const selectItem = useCallback(
    async (index: number) => {
      const api = apiRef.current
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

      // 先清理触发字符，避免部分命令（列表、引用）在转换后再删字符导致换行
      api.clearQuery()

      await item.onSelect(editor as Editor, context)
    },
    [items, state, editor]
  )

  const close = useCallback(() => {
    apiRef.current?.close()
  }, [])

  // ======================
  // * Keyboard Navigation
  // ======================

  useEffect(() => {
    if (!editor || !editor.view) {
      return
    }

    const viewDom = editor.view.dom

    const handleKeydown = (event: KeyboardEvent) => {
      if (!state.active) {
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        event.stopPropagation()
        setActiveIndex((prev) => (prev + 1) % items.length)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        event.stopPropagation()
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        selectItem(activeIndex)
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    }

    viewDom.addEventListener('keydown', handleKeydown, true)

    return () => {
      viewDom.removeEventListener('keydown', handleKeydown, true)
    }
  }, [editor, state.active, activeIndex, items.length, selectItem, close, setActiveIndex])

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


