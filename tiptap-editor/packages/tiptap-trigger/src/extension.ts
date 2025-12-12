import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import type { SuggestionPluginAPI, SuggestionTriggerOptions } from './types'
import { ERROR_EXTENSION_API_NOT_AVAILABLE, ERROR_EXTENSION_NOT_MOUNTED, TRIGGER_EXTENSION_NAME } from './constans'
import { createSuggestionPlugin } from './createSuggestionPlugin'

export const SuggestionTrigger = {
  configure() {
    const { key, plugin, getAPI } = createSuggestionPlugin()
    return Extension.create<{ triggers?: SuggestionTriggerOptions[] }>({
      name: TRIGGER_EXTENSION_NAME,

      addOptions: () => ({
        triggers: []
      }),
      addStorage: () => ({
        suggestionPluginKey: key,
        getSuggestionAPI: getAPI
      }),
      addProseMirrorPlugins: () => [plugin],

      addCommands() {
        return {
          addSuggestionTrigger:
            (trigger: SuggestionTriggerOptions) =>
              () => {
                const getAPI = this.storage.getSuggestionAPI
                if (!getAPI) {
                  return false
                }
                const api = getAPI()
                api.addTrigger(trigger)
                return true
              },

          removeSuggestionTrigger:
            (triggerId: string) =>
              () => {
                const getAPI = this.storage.getSuggestionAPI
                if (!getAPI) {
                  return false
                }
                const api = getAPI()
                api.removeTrigger(triggerId)
                return true
              },

          openSuggestion:
            (triggerId, options) =>
              () => {
                const getAPI = this.storage.getSuggestionAPI
                if (!getAPI) {
                  return false
                }
                const api = getAPI()
                api.open(triggerId, options)
                return true
              },

          closeSuggestion:
            () =>
              () => {
                const getAPI = this.storage.getSuggestionAPI
                if (!getAPI) {
                  return false
                }
                const api = getAPI()
                api.close()
                return true
              },

          clearSuggestionQuery:
            () =>
              () => {
                const getAPI = this.storage.getSuggestionAPI
                if (!getAPI) {
                  return false
                }
                const api = getAPI()
                api.clearQuery()
                return true
              },
        }
      },
    })
  }
}

/**
 * 从 editor 中获取 Suggestion 插件的 API
 */
export function getSuggestionPluginAPI(editor: Editor): SuggestionPluginAPI {
  const extension = editor.extensionManager.extensions.find(
    (item) => item.name === TRIGGER_EXTENSION_NAME
  ) as { storage?: Record<string, unknown> } | undefined

  if (!extension || !extension.storage) {
    throw new Error(ERROR_EXTENSION_NOT_MOUNTED)
  }

  const getAPI = extension.storage.getSuggestionAPI as (() => SuggestionPluginAPI) | undefined

  if (!getAPI) {
    throw new Error(ERROR_EXTENSION_API_NOT_AVAILABLE)
  }

  return getAPI()
}


declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    suggestionTrigger: {
      /**
       * 注册一个 Suggestion Trigger
       */
      addSuggestionTrigger: (trigger: SuggestionTriggerOptions) => ReturnType
      /**
       * 通过 ID 移除 Suggestion Trigger
       */
      removeSuggestionTrigger: (triggerId: string) => ReturnType
      /**
       * 编程式打开 Suggestion 菜单
       */
      openSuggestion: (
        triggerId: string,
        options?: {
          ignoreQueryLength?: boolean
          deleteTriggerCharacter?: boolean
        }
      ) => ReturnType
      /**
       * 关闭 Suggestion 菜单
       */
      closeSuggestion: () => ReturnType
      /**
       * 清理当前 query（删除触发字符 + query）
       */
      clearSuggestionQuery: () => ReturnType
    }
  }
}
