import type { SearchOptions } from './types'
import { Extension } from '@tiptap/core'
import { createSearchPlugin } from './plugin'
import { selectCurrentMatch } from './scroll-to-match'
import { dispatchSearchAction } from './search-state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    search: {
      /** 设置搜索词并定位到第一个匹配项 */
      setSearchQuery: (query: string, caseSensitive?: boolean) => ReturnType
      /** 跳转到下一个匹配项 */
      nextSearchResult: () => ReturnType
      /** 跳转到上一个匹配项 */
      previousSearchResult: () => ReturnType
      /** 清空搜索状态与高亮 */
      clearSearch: () => ReturnType
    }
  }
}

export const Search = Extension.create<SearchOptions>({
  name: 'search',

  addOptions() {
    return {
      matchClass: '',
      currentMatchClass: '',
      scrollBehavior: 'smooth',
      scrollBlock: 'center',
      /** 默认不启用；宿主按需注入（如 leafTextFromRenderText 让 speaker 等原子节点可被搜索） */
      leafText: undefined,
    }
  },

  addCommands() {
    return {
      setSearchQuery: (query, caseSensitive = false) => () => {
        dispatchSearchAction(this.editor, { type: 'setQuery', query, caseSensitive })
        selectCurrentMatch(this.editor, this.options)
        return true
      },
      nextSearchResult: () => () => {
        dispatchSearchAction(this.editor, { type: 'move', direction: 1 })
        selectCurrentMatch(this.editor, this.options)
        return true
      },
      previousSearchResult: () => () => {
        dispatchSearchAction(this.editor, { type: 'move', direction: -1 })
        selectCurrentMatch(this.editor, this.options)
        return true
      },
      clearSearch: () => () => {
        dispatchSearchAction(this.editor, { type: 'clear' })
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    return [createSearchPlugin(this.options)]
  },
})
