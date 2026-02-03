import type { Editor } from '@tiptap/core'
import type { SuggestionItem } from '../types'
import type { TriggerConfig } from './types'
import { useEffect, useRef, useState } from 'react'

interface UseSuggestionDataProps {
  editor: Editor | null | undefined
  active: boolean
  query: string
  ignoreQueryLength: boolean
  triggerId: string | null
  triggerConfig: TriggerConfig | null
}

export function useSuggestionData({
  editor,
  active,
  query,
  ignoreQueryLength,
  triggerId,
  triggerConfig,
}: UseSuggestionDataProps) {
  const [items, setItems] = useState<SuggestionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!active || !triggerConfig || !editor) {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    const minLen = triggerConfig.minQueryLength ?? 0
    if (!ignoreQueryLength && query.length < minLen) {
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
          triggerId: triggerId ?? '',
          query,
          editor: editor as Editor,
        }),
      ),
    )
      .then(async (results) => {
        if (currentReq !== requestIdRef.current) {
          return
        }
        let rawItems = results.flat()
        if (triggerConfig.filterItems) {
          rawItems = await Promise.resolve(triggerConfig.filterItems(rawItems))
        }
        setItems(rawItems)
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
  }, [active, query, ignoreQueryLength, triggerId, triggerConfig, editor])

  return { items, loading, error }
}
