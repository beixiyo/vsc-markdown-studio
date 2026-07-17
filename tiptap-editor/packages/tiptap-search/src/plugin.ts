import type { SearchOptions, SearchState } from './types'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { findTextMatches } from './search'
import { applySearchAction, createEmptySearchState, searchPluginKey } from './search-state'

/** 创建负责匹配计算和 Decoration 渲染的 ProseMirror 插件 */
export function createSearchPlugin(options: SearchOptions) {
  return new Plugin<SearchState>({
    key: searchPluginKey,
    state: {
      init: createEmptySearchState,
      apply(transaction, previousState, _oldState, newState) {
        const action = transaction.getMeta(searchPluginKey)
        const nextState = applySearchAction(previousState, action)

        if (!transaction.docChanged && action?.type !== 'setQuery') {
          return nextState
        }

        const matches = findTextMatches(newState.doc, nextState.query, nextState.caseSensitive, {
          leafText: options.leafText,
        })

        return {
          ...nextState,
          matches,
          currentIndex: matches.length === 0
            ? -1
            : Math.min(Math.max(nextState.currentIndex, 0), matches.length - 1),
        }
      },
    },
    props: {
      decorations(state) {
        const searchState = searchPluginKey.getState(state)
        if (!searchState) {
          return DecorationSet.empty
        }

        return DecorationSet.create(
          state.doc,
          searchState.matches.map((match, index) => {
            const isCurrent = index === searchState.currentIndex
            const className = [
              options.matchClass,
              isCurrent && options.currentMatchClass,
            ].filter(Boolean).join(' ')

            return Decoration.inline(
              match.from,
              match.to,
              {
                ...(className
                  ? { class: className }
                  : {}),
                'data-search-match': isCurrent
                  ? 'current'
                  : 'match',
              },
            )
          }),
        )
      },
    },
  })
}
