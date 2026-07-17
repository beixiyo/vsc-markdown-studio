import type { Editor } from '@tiptap/core'
import type { SearchOptions } from './types'
import { TextSelection } from '@tiptap/pm/state'
import { getSearchState } from './search-state'

/** 选中当前匹配项，并优先将其滚动到可视区域中心 */
export function selectCurrentMatch(editor: Editor, options: SearchOptions) {
  const searchState = getSearchState(editor)
  const match = searchState.matches[searchState.currentIndex]
  if (!match) {
    return
  }

  const transaction = editor.state.tr
    .setSelection(TextSelection.create(editor.state.doc, match.from, match.to))
    .scrollIntoView()
  editor.view.dispatch(transaction)

  const scrollToCurrentMatch = () => {
    /** rAF 回调可能晚于编辑器销毁执行（如跳转后立刻卸载编辑器），此时访问 view 会抛错 */
    if (editor.isDestroyed) {
      return
    }

    const currentMatch = editor.view.dom.querySelector<HTMLElement>('[data-search-match="current"]')
    const target = currentMatch ?? getElementAtPosition(editor, match.from)
    target?.scrollIntoView?.({
      behavior: options.scrollBehavior,
      block: options.scrollBlock,
      inline: 'nearest',
    })
  }

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(scrollToCurrentMatch)
    return
  }

  scrollToCurrentMatch()
}

function getElementAtPosition(editor: Editor, position: number): HTMLElement | null {
  const domAtPos = editor.view.domAtPos(position)
  return domAtPos.node.nodeType === Node.TEXT_NODE
    ? domAtPos.node.parentElement
    : domAtPos.node as HTMLElement
}
