import type { Editor } from '@tiptap/core'
import type { SearchState } from './types'
import { PluginKey } from '@tiptap/pm/state'

export const searchPluginKey = new PluginKey<SearchState>('search')

/** 读取指定编辑器的搜索状态 */
export function getSearchState(editor: Editor | null): SearchState {
  if (!editor) {
    return createEmptySearchState()
  }

  const directState = searchPluginKey.getState(editor.state)
  if (directState) {
    return directState
  }

  const registeredState = editor.state.plugins
    .map(plugin => plugin.getState(editor.state) as unknown)
    .find(isSearchState)
  return registeredState ?? createEmptySearchState()
}

/** 创建无查询词的初始搜索状态 */
export function createEmptySearchState(): SearchState {
  return {
    query: '',
    caseSensitive: false,
    matches: [],
    currentIndex: -1,
  }
}

/** 根据搜索动作生成下一状态 */
export function applySearchAction(state: SearchState, action?: SearchAction): SearchState {
  if (!action) {
    return state
  }

  switch (action.type) {
    case 'setQuery':
      return {
        ...state,
        query: action.query,
        caseSensitive: action.caseSensitive,
        currentIndex: action.query ? 0 : -1,
      }
    case 'move': {
      if (state.matches.length === 0) {
        return state
      }

      return {
        ...state,
        currentIndex: (state.currentIndex + action.direction + state.matches.length) % state.matches.length,
      }
    }
    case 'clear':
      return createEmptySearchState()
  }
}

/** 向搜索插件派发 headless 状态动作 */
export function dispatchSearchAction(editor: Editor, action: SearchAction) {
  editor.view.dispatch(editor.state.tr.setMeta(searchPluginKey, action))
}

function isSearchState(state: unknown): state is SearchState {
  if (!state || typeof state !== 'object') {
    return false
  }

  const candidate = state as Partial<SearchState>
  return typeof candidate.query === 'string'
    && typeof candidate.caseSensitive === 'boolean'
    && Array.isArray(candidate.matches)
    && typeof candidate.currentIndex === 'number'
}

export type SearchAction
  = | { type: 'setQuery', query: string, caseSensitive: boolean }
    | { type: 'move', direction: 1 | -1 }
    | { type: 'clear' }
