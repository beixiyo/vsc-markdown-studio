import type { EditorView } from '@tiptap/pm/view'
import { TextSelection } from '@tiptap/pm/state'
import { sanitizeUrl } from 'tiptap-config'

/**
 * 处理 Ctrl/Cmd 点击链接的场景，安全打开新窗口
 */
function handleMetaLinkOpen(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const linkEl = target?.closest<HTMLAnchorElement>('a[href]')
  if (!linkEl?.href) {
    return false
  }
  event.preventDefault()
  const safeUrl = sanitizeUrl(linkEl.href, window.location.href)
  if (safeUrl !== '#') {
    window.open(safeUrl, '_blank', 'noopener,noreferrer')
  }
  return true
}

/**
 * 判断点击位置是否落在当前选区范围
 */
function isWithinSelection(clickPos: { pos: number }, from: number, to: number) {
  return clickPos.pos >= from && clickPos.pos <= to
}

/**
 * 当点击命中现有选区时，移动光标到点击位置以取消选区
 */
export function handleSelectionToggle(view: EditorView, clickPos: { pos: number }) {
  const { state, dispatch } = view
  const { selection } = state
  const { from, to } = selection
  if (!isWithinSelection(clickPos, from, to)) {
    return false
  }
  const resolved = state.doc.resolve(clickPos.pos)
  dispatch(state.tr.setSelection(TextSelection.near(resolved)))
  return true
}

/**
 * 创建编辑器点击处理函数：支持链接打开、选区还原
 */
export function createHandleClick() {
  return (view: EditorView, _pos: number, event: Event) => {
    const mouseEvent = event as MouseEvent
    const { selection } = view.state

    if ((mouseEvent.ctrlKey || mouseEvent.metaKey) && mouseEvent.button === 0) {
      const opened = handleMetaLinkOpen(mouseEvent)
      if (opened) {
        return true
      }
    }

    if (mouseEvent.button !== 0 || selection.empty) {
      return false
    }

    const clickedPos = view.posAtCoords({
      left: mouseEvent.clientX,
      top: mouseEvent.clientY,
    })

    if (!clickedPos) {
      return false
    }

    const toggled = handleSelectionToggle(view, clickedPos)
    if (toggled) {
      return true
    }

    return false
  }
}

