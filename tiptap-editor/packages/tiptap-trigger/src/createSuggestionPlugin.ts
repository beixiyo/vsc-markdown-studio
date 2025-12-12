import type { PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import type { SuggestionPluginAPI, SuggestionState, SuggestionTriggerOptions } from './types'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { TRIGGER_PLUGIN_KEY } from './constans'

export function createSuggestionPlugin(): {
  key: PluginKey<SuggestionState>
  plugin: Plugin<SuggestionState>
  getAPI: () => SuggestionPluginAPI
} {
  let view: EditorView | null = null
  const triggers = new Map<string, SuggestionTriggerOptions>()

  let currentState: SuggestionState = {
    active: false,
    triggerId: null,
    triggerCharacter: null,
    query: '',
    queryStartPos: null,
    referenceRect: null,
    ignoreQueryLength: false,
    decorationId: null,
    deleteTriggerCharacter: false,
  }
  const initialState = currentState

  const listeners = new Set<(state: SuggestionState) => void>()

  const notify = (state: SuggestionState) => {
    if (state === currentState) {
      return
    }
    currentState = state
    listeners.forEach(listener => listener(state))
  }

  const plugin = new Plugin<SuggestionState>({
    key: TRIGGER_PLUGIN_KEY,

    state: {
      init: () => initialState,

      apply(tr, prev) {
        let next = prev

        const meta = tr.getMeta(TRIGGER_PLUGIN_KEY) as
          | {
            type: 'open'
            triggerId: string
            deleteTriggerCharacter?: boolean
            ignoreQueryLength?: boolean
          }
          | { type: 'close' }
          | { type: 'clearQuery' }
          | undefined

        if (meta?.type === 'close' || meta?.type === 'clearQuery') {
          next = {
            active: false,
            triggerId: null,
            triggerCharacter: null,
            query: '',
            queryStartPos: null,
            referenceRect: null,
            ignoreQueryLength: false,
            decorationId: null,
            deleteTriggerCharacter: false,
          }

          notify(next)
          return next
        }

        if (meta?.type === 'open') {
          const trigger = triggers.get(meta.triggerId)
          const selection = tr.selection

          next = {
            active: true,
            triggerId: trigger?.id ?? meta.triggerId,
            triggerCharacter: trigger?.character ?? null,
            query: '',
            queryStartPos: selection.from,
            referenceRect: null,
            ignoreQueryLength: Boolean(meta.ignoreQueryLength),
            decorationId: `suggestion-${Math.random().toString(36).slice(2)}`,
            deleteTriggerCharacter: Boolean(meta.deleteTriggerCharacter ?? trigger?.deleteTriggerCharacterOnSelect),
          }

          notify(next)
          return next
        }

        if (!next.active) {
          return next
        }

        const selection = tr.selection

        if (!selection.empty || next.queryStartPos === null || selection.from < next.queryStartPos) {
          const reset: SuggestionState = {
            active: false,
            triggerId: null,
            triggerCharacter: null,
            query: '',
            queryStartPos: null,
            referenceRect: null,
            ignoreQueryLength: false,
            decorationId: null,
            deleteTriggerCharacter: false,
          }

          notify(reset)
          return reset
        }

        const query = tr.doc.textBetween(next.queryStartPos, selection.from, '\n', '\n')

        if (query === next.query) {
          return next
        }

        const updated: SuggestionState = {
          ...next,
          query,
        }

        notify(updated)
        return updated
      },
    },

    view(editorView) {
      view = editorView

      return {
        update(updatedView) {
          view = updatedView

          /** 同步 referenceRect（用于浮层定位） */
          const state = TRIGGER_PLUGIN_KEY.getState(updatedView.state) ?? currentState
          if (!state.active || !state.decorationId) {
            if (state.referenceRect !== null) {
              const resetRect: SuggestionState = {
                ...state,
                referenceRect: null,
              }
              notify(resetRect)
            }
            return
          }

          const dom = updatedView.dom.querySelector<HTMLElement>(
            `[data-suggestion-decoration-id="${state.decorationId}"]`,
          )

          if (!dom) {
            if (state.referenceRect !== null) {
              const resetRect: SuggestionState = {
                ...state,
                referenceRect: null,
              }
              notify(resetRect)
            }
            return
          }

          const rect = dom.getBoundingClientRect()

          if (!state.referenceRect
            || rect.top !== state.referenceRect.top
            || rect.left !== state.referenceRect.left
            || rect.bottom !== state.referenceRect.bottom
            || rect.right !== state.referenceRect.right) {
            const next: SuggestionState = {
              ...state,
              referenceRect: rect,
            }
            notify(next)
          }
        },

        destroy() {
          if (view === editorView) {
            view = null
          }
        },
      }
    },

    props: {
      handleDOMEvents: {
        /**
         * 失焦时关闭菜单
         */
        focusout(viewArg, event) {
          const related = event.relatedTarget as Node | null
          if (related && viewArg.dom.contains(related)) {
            return false
          }
          const { state, dispatch } = viewArg
          const tr = state.tr.setMeta(TRIGGER_PLUGIN_KEY, { type: 'close' })
          dispatch(tr)
          return false
        },
      },

      /**
       * 监听文本输入，识别触发字符，开启 Suggestion
       */
      handleTextInput(editorView, from, to, text) {
        if (from !== to) {
          return false
        }

        /** 只处理单字符触发 */
        if (!text || text.length !== 1) {
          return false
        }

        const trigger = Array.from(triggers.values()).find(item => item.character === text)

        if (!trigger) {
          return false
        }

        const { state } = editorView
        let tr = state.tr.insertText(text, from, to)

        tr = tr.setMeta(TRIGGER_PLUGIN_KEY, {
          type: 'open',
          triggerId: trigger.id,
        })

        editorView.dispatch(tr)

        return true
      },

      /**
       * 为触发位置创建 Decoration，用于计算浮层锚点
       */
      decorations(state) {
        const pluginState = TRIGGER_PLUGIN_KEY.getState(state) as SuggestionState | null

        if (!pluginState || !pluginState.active || pluginState.queryStartPos === null) {
          return DecorationSet.empty
        }

        const pos = Math.max(pluginState.queryStartPos - 1, 0)

        const widget = Decoration.widget(
          pos,
          () => {
            const span = document.createElement('span')
            span.setAttribute(
              'data-suggestion-decoration-id',
              pluginState.decorationId ?? '',
            )
            span.style.position = 'relative'
            span.style.display = 'inline-flex'
            span.style.width = '0'
            span.style.height = '0'
            return span
          },
          {
            key: pluginState.decorationId ?? undefined,
          },
        )

        return DecorationSet.create(state.doc, [widget])
      },
    },
  })

  const api: SuggestionPluginAPI = {
    addTrigger(trigger) {
      triggers.set(trigger.id, trigger)
    },

    removeTrigger(triggerId) {
      triggers.delete(triggerId)
    },

    open(triggerId, options) {
      if (!view) {
        return
      }

      const trigger = triggers.get(triggerId)
      const { state, dispatch } = view

      const tr = state.tr.setMeta(TRIGGER_PLUGIN_KEY, {
        type: 'open',
        triggerId,
        deleteTriggerCharacter: options?.deleteTriggerCharacter ?? trigger?.deleteTriggerCharacterOnSelect,
        ignoreQueryLength: options?.ignoreQueryLength,
      })

      dispatch(tr)
    },

    close() {
      if (!view) {
        return
      }

      const { state, dispatch } = view
      const tr = state.tr.setMeta(TRIGGER_PLUGIN_KEY, { type: 'close' })
      dispatch(tr)
    },

    clearQuery() {
      if (!view) {
        return
      }

      const { state } = view
      const pluginState = TRIGGER_PLUGIN_KEY.getState(state) as SuggestionState | null

      if (!pluginState || pluginState.queryStartPos === null) {
        const tr = state.tr.setMeta(TRIGGER_PLUGIN_KEY, { type: 'clearQuery' })
        view.dispatch(tr)
        return
      }

      const from = Math.max(pluginState.queryStartPos - 1, 0)
      const to = state.selection.from

      if (to < from) {
        const tr = state.tr.setMeta(TRIGGER_PLUGIN_KEY, { type: 'clearQuery' })
        view.dispatch(tr)
        return
      }

      const tr = state.tr.delete(from, to).setMeta(TRIGGER_PLUGIN_KEY, { type: 'close' })
      view.dispatch(tr)
    },

    getState() {
      return currentState
    },

    subscribe(listener) {
      listeners.add(listener)
      listener(currentState)

      return () => {
        listeners.delete(listener)
      }
    },
  }

  const getAPI = () => api

  return {
    key: TRIGGER_PLUGIN_KEY,
    plugin,
    getAPI,
  }
}
