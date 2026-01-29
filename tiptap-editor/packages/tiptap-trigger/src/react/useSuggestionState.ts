import type { Editor } from '@tiptap/core'
import type { SuggestionPluginAPI, SuggestionState } from '../types'
import type { SuggestionConfig } from './types'
import { useEffect, useState } from 'react'
import { ERROR_EXTENSION_API_NOT_AVAILABLE, ERROR_EXTENSION_NOT_MOUNTED } from '../constants'
import { getSuggestionPluginAPI } from '../extension'
import { isSameState } from './compare'

export function useSuggestionState(
  editor: Editor | null | undefined,
  config: SuggestionConfig,
) {
  const [api, setApi] = useState<SuggestionPluginAPI | null>(null)
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

  return { state, api }
}
