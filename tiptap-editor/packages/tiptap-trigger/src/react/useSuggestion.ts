import type { Editor } from '@tiptap/core'
import type {
  SuggestionItem,
  SuggestionPluginAPI,
  SuggestionState,
} from '../types'
import type { SuggestionConfig, SuggestionResult } from './types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ERROR_EXTENSION_API_NOT_AVAILABLE, ERROR_EXTENSION_NOT_MOUNTED } from '../constans'
import { getSuggestionPluginAPI } from '../extension'
import { isSameState } from './compare'
import { useWatchRef } from './useWatchRef'

/**
 * 将插件状态机与数据源、UI 交互粘合的控制器
 * 仅处理状态流转和数据请求，不包含具体 UI
 */
export function useSuggestion(
  editor: Editor | null | undefined,
  config: SuggestionConfig,
): SuggestionResult {
  const configRef = useWatchRef(config)
  const [api, setApi] = useState<SuggestionPluginAPI | null>(null)

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
  useEffect(() => {
    if (!editor) {
      setApi(null)
      return
    }

    let unsubscribe: (() => void) | null = null
    let retryTimer: number | null = null
    let disposed = false
    let retryCount = 0
    const maxRetry = 50
    const retryDelay = 16

    const setup = () => {
      if (disposed) {
        return
      }

      let apiInstance: SuggestionPluginAPI | null = null
      try {
        apiInstance = getSuggestionPluginAPI(editor)
      }
      catch (error) {
        if (
          error instanceof Error
          && (error.message === ERROR_EXTENSION_API_NOT_AVAILABLE || error.message === ERROR_EXTENSION_NOT_MOUNTED)
        ) {
          if (retryCount >= maxRetry) {
            console.error(ERROR_EXTENSION_NOT_MOUNTED, error)
            return
          }
          retryCount += 1
          retryTimer = window.setTimeout(setup, retryDelay)
          return
        }
        console.error(ERROR_EXTENSION_NOT_MOUNTED, error)
        return
      }

      setApi(apiInstance)

      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }

      unsubscribe = apiInstance.subscribe((next) => {
        if (disposed) {
          return
        }
        setState(prev => (isSameState(prev, next)
          ? prev
          : next))
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
    }
  }, [editor])

  /**
   * 同步 Triggers 配置到插件中
   */
  useEffect(() => {
    if (!api || !config) {
      return
    }

    const entries = Object.entries(config)
    const addedTriggerIds = entries.map(([id, cfg]) => {
      api.addTrigger({
        id,
        ...cfg,
      })
      return id
    })

    return () => {
      addedTriggerIds.forEach(id => api.removeTrigger(id))
    }
  }, [api, config])

  const triggerConfig = useMemo(() => {
    if (!state.triggerId) {
      return null
    }
    return configRef.current[state.triggerId] ?? null
  }, [state.triggerId])

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
      triggerConfig.sources.map(source =>
        source.fetchItems({
          triggerId: state.triggerId ?? '',
          query: state.query,
          editor: editor as Editor,
        }),
      ),
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
        setError(err instanceof Error
          ? err
          : new Error('unknown error'))
        setLoading(false)
      })
  }, [state.active, state.query, state.ignoreQueryLength, state.triggerId, triggerConfig, editor])

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

  useEffect(() => {
    if (!editor || !editor.view) {
      return
    }

    const viewDom = editor.view.dom

    const handleKeydown = (event: KeyboardEvent) => {
      if (!state.active) {
        return
      }

      if (items.length === 0) {
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        event.stopPropagation()
        setActiveIndex(prev => (prev + 1) % items.length)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        event.stopPropagation()
        setActiveIndex(prev => (prev - 1 + items.length) % items.length)
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
